// One-off cleanup for customers wrongly tagged wholesale-pending.
//
// Until this was fixed, customer-account-get auto-tagged ANY customer with no
// wholesale tag and no orders as wholesale-pending, on every session read. Once
// /signup existed, that meant ordinary retail customers — who never applied for
// wholesale — landed in the /wholesale-admin approval queue, where an
// accidental Approve would have granted them wholesale pricing.
//
// A genuine applicant always leaves a row in wholesale_requests (written by the
// /wholesale-request form), so that table is the discriminator:
//
//   tagged wholesale-pending  +  NO wholesale_requests row  =  tagged in error
//
// Two modes, deliberately separate so nothing is removed without being seen:
//   mode "list"  (default) — read-only. Returns both groups for review.
//   mode "apply"           — removes the tag from the customerIds you pass in.
//                            It never derives that list itself.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_VERSION = "2024-10";

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

interface Candidate {
  id: string;
  email: string | null;
  name: string;
  numberOfOrders: number;
  company: string | null;
  createdAt: string;
  tags: string[];
  hasApplication: boolean;
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
    if (!(await isAdmin(body?.token))) return json({ error: "Unauthorized" }, 401);

    const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
    const adminToken =
      Deno.env.get("SHOPIFY_ADMIN_TOKEN") ??
      Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
    if (!domain || !adminToken) {
      console.error("Missing SHOPIFY_STORE_DOMAIN or admin token");
      return json({ error: "Server not configured" }, 500);
    }

    const shopify = async (query: string, variables: Record<string, unknown>) => {
      const resp = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": adminToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });
      const data = await resp.json();
      if (data?.errors) {
        console.error("shopify errors:", JSON.stringify(data.errors));
        throw new Error("Shopify request failed");
      }
      return data;
    };

    const mode = body?.mode === "apply" ? "apply" : "list";

    /* ── apply ────────────────────────────────────────────────────────────
       Removes wholesale-pending from exactly the ids handed in. The list is
       never recomputed here: whoever calls this has already reviewed it. */
    if (mode === "apply") {
      const ids: string[] = Array.isArray(body?.customerIds) ? body.customerIds : [];
      if (ids.length === 0) return json({ error: "No customerIds given" }, 400);

      const removed: string[] = [];
      const failed: { id: string; error: string }[] = [];

      for (const id of ids) {
        try {
          const res = await shopify(
            `mutation($id: ID!, $tags: [String!]!) {
              tagsRemove(id: $id, tags: $tags) { userErrors { field message } }
            }`,
            { id, tags: ["wholesale-pending"] },
          );
          const errs = res?.data?.tagsRemove?.userErrors ?? [];
          if (errs.length) failed.push({ id, error: errs.map((e: any) => e.message).join("; ") });
          else removed.push(id);
        } catch (e) {
          failed.push({ id, error: (e as Error).message });
        }
      }

      return json({ mode, removed, removedCount: removed.length, failed });
    }

    /* ── list ─────────────────────────────────────────────────────────────
       Page through every wholesale-pending customer, then cross-reference
       wholesale_requests to decide who actually applied. */
    const pending: any[] = [];
    let cursor: string | null = null;

    do {
      const data: any = await shopify(
        `query($q: String!, $after: String) {
          customers(first: 250, query: $q, after: $after, sortKey: CREATED_AT, reverse: true) {
            edges {
              cursor
              node {
                id email firstName lastName createdAt tags numberOfOrders
                defaultAddress { company }
              }
            }
            pageInfo { hasNextPage }
          }
        }`,
        { q: "tag:wholesale-pending", after: cursor },
      );
      const edges = data?.data?.customers?.edges ?? [];
      pending.push(...edges.map((e: any) => e.node));
      cursor = edges.length ? edges[edges.length - 1].cursor : null;
      if (!data?.data?.customers?.pageInfo?.hasNextPage) cursor = null;
    } while (cursor);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: requests, error: reqErr } = await supabase
      .from("wholesale_requests")
      .select("email");
    if (reqErr) throw reqErr;

    const applied = new Set(
      (requests ?? [])
        .map((r: { email: string | null }) => (r.email ?? "").trim().toLowerCase())
        .filter(Boolean),
    );

    const toCandidate = (n: any): Candidate => ({
      id: n.id,
      email: n.email,
      name: [n.firstName, n.lastName].filter(Boolean).join(" ") || "—",
      numberOfOrders: Number(n.numberOfOrders ?? 0),
      company: n.defaultAddress?.company ?? null,
      createdAt: n.createdAt,
      tags: Array.isArray(n.tags) ? n.tags : [],
      hasApplication: applied.has((n.email ?? "").trim().toLowerCase()),
    });

    const all = pending.map(toCandidate);

    // Only ever propose removal for customers with no application on file. An
    // order history or a company name is a further sign of a real business, so
    // those are held back for manual review rather than auto-listed.
    const wronglyTagged = all.filter(
      (c) => !c.hasApplication && c.numberOfOrders === 0 && !c.company,
    );
    const needsReview = all.filter(
      (c) => !c.hasApplication && (c.numberOfOrders > 0 || !!c.company),
    );
    const genuine = all.filter((c) => c.hasApplication);

    return json({
      mode,
      totalPending: all.length,
      wronglyTagged,
      needsReview,
      genuine: genuine.map((c) => ({ id: c.id, email: c.email, name: c.name })),
      counts: {
        wronglyTagged: wronglyTagged.length,
        needsReview: needsReview.length,
        genuine: genuine.length,
      },
    });
  } catch (e) {
    console.error("audit-wholesale-tags error:", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
