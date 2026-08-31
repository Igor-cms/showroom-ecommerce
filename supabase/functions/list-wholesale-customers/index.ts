import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const getKey = async () => {
  const secret = Deno.env.get("ADMIN_PASSWORD") || "fallback-admin-secret";
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
};

async function isAdmin(token: unknown): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  try {
    const p = await verify(token, await getKey(), "HS256");
    return p.access === "admin" && (!p.exp || (p.exp as number) > Date.now() / 1000);
  } catch {
    return false;
  }
}

function statusFromTags(tags: string[]): string | null {
  if (tags.includes("wholesale-approved")) return "approved";
  if (tags.includes("wholesale-rejected")) return "rejected";
  if (tags.includes("wholesale-pending")) return "pending";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json().catch(() => ({}));
    if (!(await isAdmin(body.token))) return json({ error: "Unauthorized" }, 401);

    const status = String(body.status ?? "all");
    const tagQuery =
      status === "pending"
        ? "tag:wholesale-pending"
        : status === "approved"
        ? "tag:wholesale-approved"
        : status === "rejected"
        ? "tag:wholesale-rejected"
        : "(tag:wholesale-pending OR tag:wholesale-approved OR tag:wholesale-rejected)";

    const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
    const adminToken =
      Deno.env.get("SHOPIFY_ADMIN_TOKEN") ??
      Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
    if (!domain || !adminToken) {
      console.error("Missing SHOPIFY_STORE_DOMAIN or admin token");
      return json({ error: "Server not configured" }, 500);
    }

    const resp = await fetch(
      `https://${domain}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": adminToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query($q: String!) {
            customers(first: 100, query: $q, sortKey: UPDATED_AT, reverse: true) {
              edges { node {
                id
                firstName
                lastName
                email
                phone
                createdAt
                updatedAt
                tags
                defaultAddress {
                  company address1 address2 city province country zip phone
                }
                taxMeta: metafield(namespace: "wholesale", key: "business_tax_number") { value }
                otherMeta: metafield(namespace: "wholesale", key: "other_business_number") { value }
              } }
            }
          }`,
          variables: { q: tagQuery },
        }),
      },
    );

    const data = await resp.json();
    if (data?.errors) {
      console.error("list customers errors:", JSON.stringify(data.errors));
      return json({ error: "Shopify request failed" }, 502);
    }

    const edges = data?.data?.customers?.edges ?? [];
    const customers = edges.map((e: any) => {
      const n = e.node;
      const tags: string[] = Array.isArray(n.tags) ? n.tags : [];
      return {
        id: n.id,
        firstName: n.firstName ?? "",
        lastName: n.lastName ?? "",
        email: n.email ?? "",
        phone: n.phone ?? n.defaultAddress?.phone ?? "",
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        status: statusFromTags(tags),
        shopName: n.defaultAddress?.company ?? "",
        address: n.defaultAddress
          ? [n.defaultAddress.address1, n.defaultAddress.address2, n.defaultAddress.city, n.defaultAddress.province, n.defaultAddress.country, n.defaultAddress.zip]
              .map((p: string | null) => (p ?? "").trim())
              .filter(Boolean)
              .join(", ")
          : "",
        businessTaxNumber: n.taxMeta?.value ?? "",
        otherBusinessNumber: n.otherMeta?.value ?? "",
      };
    });

    return json({ customers });
  } catch (e) {
    console.error("list-wholesale-customers error:", (e as Error).message);
    return json({ error: "Unexpected error" }, 500);
  }
});
