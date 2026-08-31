// Admin view over the back-in-stock signup list.
//
// summary -> one row per coffee with a count, for the dashboard table.
// detail  -> the individual signups for one coffee, for CSV export.
//
// Gated by the same admin JWT as list-wholesale-customers (HS256 signed with
// ADMIN_PASSWORD), so the owner uses one password for both dashboards.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

interface SignupRow {
  id: string;
  product_handle: string;
  product_title: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  source: string;
  mailchimp_status: string;
  created_at: string;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    if (!(await isAdmin(body?.token))) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const mode = body?.mode === "detail" ? "detail" : "summary";

    if (mode === "detail") {
      const handle = String(body?.productHandle ?? "").trim();
      if (!handle) return json({ error: "Missing productHandle" }, 400);

      const { data, error } = await supabase
        .from("stock_notify_signups")
        .select("id, product_handle, product_title, email, first_name, last_name, source, mailchimp_status, created_at")
        .eq("product_handle", handle)
        .is("unsubscribed_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return json({ signups: data ?? [] }, 200);
    }

    // Summary. Supabase has no GROUP BY over the REST client, so aggregate
    // here — the list is small (one row per person per coffee) and this avoids
    // adding a database view for a dashboard that loads once.
    const { data, error } = await supabase
      .from("stock_notify_signups")
      .select("product_handle, product_title, created_at")
      .is("unsubscribed_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const byHandle = new Map<
      string,
      { productHandle: string; productTitle: string | null; count: number; lastSignupAt: string }
    >();

    for (const row of (data ?? []) as Pick<SignupRow, "product_handle" | "product_title" | "created_at">[]) {
      const found = byHandle.get(row.product_handle);
      if (found) {
        found.count += 1;
        // Rows arrive newest-first, so the first one seen is already the latest.
        if (!found.productTitle && row.product_title) found.productTitle = row.product_title;
      } else {
        byHandle.set(row.product_handle, {
          productHandle: row.product_handle,
          productTitle: row.product_title,
          count: 1,
          lastSignupAt: row.created_at,
        });
      }
    }

    const products = [...byHandle.values()].sort((a, b) => b.count - a.count);
    return json({ products, total: data?.length ?? 0 }, 200);
  } catch (e) {
    console.error("stock-notify-list error:", (e as Error).message);
    return json({ error: "Failed to load" }, 500);
  }
});
