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

    const customerId = String(body.customerId ?? "");
    const action = String(body.action ?? "");
    if (!customerId.startsWith("gid://shopify/Customer/")) {
      return json({ error: "Invalid customerId" }, 400);
    }
    if (action !== "approve" && action !== "reject") {
      return json({ error: "Invalid action" }, 400);
    }

    const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
    const adminToken =
      Deno.env.get("SHOPIFY_ADMIN_TOKEN") ??
      Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
    if (!domain || !adminToken) {
      console.error("Missing SHOPIFY_STORE_DOMAIN or admin token");
      return json({ error: "Server not configured" }, 500);
    }

    const admin = async (query: string, variables: Record<string, unknown>) => {
      const r = await fetch(
        `https://${domain}/admin/api/2024-10/graphql.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": adminToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, variables }),
        },
      );
      return r.json();
    };

    const addTag = action === "approve" ? "wholesale-approved" : "wholesale-rejected";
    const removeTags =
      action === "approve"
        ? ["wholesale-pending", "wholesale-rejected"]
        : ["wholesale-pending", "wholesale-approved"];

    const rm = await admin(
      `mutation($id: ID!, $tags: [String!]!) {
        tagsRemove(id: $id, tags: $tags) { userErrors { field message } }
      }`,
      { id: customerId, tags: removeTags },
    );
    if (rm?.errors) {
      console.error("tagsRemove errors:", JSON.stringify(rm.errors));
      return json({ error: "Shopify request failed" }, 502);
    }

    const add = await admin(
      `mutation($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
      }`,
      { id: customerId, tags: [addTag] },
    );
    const addErr = add?.data?.tagsAdd?.userErrors ?? [];
    if (add?.errors || addErr.length) {
      console.error("tagsAdd problem:", JSON.stringify(add?.errors ?? addErr));
      return json({ error: addErr[0]?.message ?? "Could not set status" }, 400);
    }

    if (action === "reject") {
      return json({ ok: true, status: "rejected" });
    }

    // Approve: only tag the customer as wholesale-approved. The B2B company is
    // created at signup, so we no longer create it here — doing so caused a
    // spurious "Email address has already been taken" warning on approval.
    return json({ ok: true, status: "approved" });
  } catch (e) {
    console.error("set-wholesale-status error:", (e as Error).message);
    return json({ error: "Unexpected error" }, 500);
  }
});
