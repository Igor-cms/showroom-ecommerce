import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json().catch(() => ({ email: "" }));
    const trimmed = String(email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return new Response(
        JSON.stringify({ error: "Invalid email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
    const token = Deno.env.get("SHOPIFY_ADMIN_TOKEN") ?? Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
    if (!domain || !token) {
      console.error("Missing SHOPIFY_STORE_DOMAIN or admin token");
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = `https://${domain}/admin/api/2024-10/customers/search.json?query=${encodeURIComponent(
      `email:${trimmed}`,
    )}`;

    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Shopify search failed:", res.status, text);
      return new Response(
        JSON.stringify({ error: "Lookup failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const customers = Array.isArray(data?.customers) ? data.customers : [];
    // Only confirm existence here. Customer details are NOT returned before the
    // user confirms their Shopify login — the update form prefills from the
    // authenticated session (customer-account-get) after login instead.
    const exists = customers.some(
      (c: any) => String(c?.email ?? "").trim().toLowerCase() === trimmed,
    );

    return new Response(
      JSON.stringify({ exists }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("check-shopify-customer error:", (e as Error).message);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
