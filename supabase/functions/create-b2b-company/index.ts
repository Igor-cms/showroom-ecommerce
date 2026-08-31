import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Minimal country-name -> ISO 3166-1 alpha-2 map. Free-text country values from
// the form are best-effort mapped; if we can't resolve a valid code we skip the
// address entirely (the company/contact are still created so the user can log
// in — the address can be completed manually in Shopify later).
const COUNTRY_CODES: Record<string, string> = {
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  us: "US",
  canada: "CA",
  ca: "CA",
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  gb: "GB",
  australia: "AU",
  au: "AU",
  brazil: "BR",
  brasil: "BR",
  br: "BR",
};

function toCountryCode(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (COUNTRY_CODES[v]) return COUNTRY_CODES[v];
  // Accept an already-valid 2-letter code.
  if (/^[a-z]{2}$/.test(v)) return v.toUpperCase();
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const firstName = String(body?.first_name ?? "").trim();
    const lastName = String(body?.last_name ?? "").trim();
    const shopName = String(body?.shop_name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const country = String(body?.country ?? "").trim();
    const state = String(body?.state ?? "").trim();
    const city = String(body?.city ?? "").trim();
    const shippingAddress = String(body?.shipping_address ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
    const token =
      Deno.env.get("SHOPIFY_ADMIN_TOKEN") ??
      Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
    if (!domain || !token) {
      console.error("Missing SHOPIFY_STORE_DOMAIN or admin token");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyName = shopName || [firstName, lastName].filter(Boolean).join(" ") || email;

    const input: Record<string, unknown> = {
      company: { name: companyName },
      companyContact: {
        email,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(phone ? { phone } : {}),
      },
      companyLocation: {
        name: companyName,
        ...(phone ? { phone } : {}),
      },
    };

    // Best-effort address; only attach when we have a valid country code.
    const countryCode = toCountryCode(country);
    if (countryCode) {
      const addr: Record<string, unknown> = { countryCode };
      if (shippingAddress) addr.address1 = shippingAddress.slice(0, 255);
      if (city) addr.city = city;
      const recipient = [firstName, lastName].filter(Boolean).join(" ");
      if (recipient) addr.recipient = recipient;
      // zoneCode (state/province) — only attach a plausible 2-letter code.
      if (/^[A-Za-z]{2}$/.test(state)) addr.zoneCode = state.toUpperCase();
      (input.companyLocation as Record<string, unknown>).shippingAddress = addr;
    }

    const query = `
      mutation companyCreate($input: CompanyCreateInput!) {
        companyCreate(input: $input) {
          company {
            id
            name
            mainContact { id }
            locations(first: 1) { edges { node { id name } } }
          }
          userErrors { field message }
        }
      }`;

    const resp = await fetch(
      `https://${domain}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables: { input } }),
      },
    );

    const json = await resp.json();

    if (json?.errors) {
      console.error("companyCreate GraphQL errors:", JSON.stringify(json.errors));
      return new Response(JSON.stringify({ error: "Shopify request failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userErrors = json?.data?.companyCreate?.userErrors ?? [];
    if (userErrors.length > 0) {
      console.error("companyCreate userErrors:", JSON.stringify(userErrors));
      return new Response(
        JSON.stringify({ error: userErrors[0]?.message ?? "Could not create company" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const company = json?.data?.companyCreate?.company ?? null;
    return new Response(
      JSON.stringify({ ok: true, company }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("create-b2b-company error:", (e as Error).message);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
