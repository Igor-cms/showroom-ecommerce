import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, getSessionId } from "../_shared/customerCors.ts";
import { toCountryCode } from "../_shared/countryCodes.ts";

// customerAddressCreate/customerAddressUpdate only exist from Admin API 2025-04+.
// Using an older version makes the address mutations fail at the GraphQL schema
// level ("Field doesn't exist on type 'Mutation'") -> generic "Could not update
// address" regardless of input.
const ADMIN_API_VERSION = "2026-04";
const CAA_API_VERSION = "2024-10";

// Shopify customer.phone must be E.164. Only forward a phone when it clearly
// qualifies — otherwise the whole customerUpdate would fail on "Phone is invalid".
function e164(phone: string): string | null {
  const p = phone.trim().replace(/[\s()-]/g, "");
  return /^\+[1-9]\d{6,14}$/.test(p) ? p : null;
}

async function refreshIfNeeded(
  supabase: ReturnType<typeof createClient>,
  session: {
    session_id: string;
    access_token: string;
    refresh_token: string | null;
    expires_at: string;
  },
): Promise<string | null> {
  if (new Date(session.expires_at).getTime() > Date.now() + 30_000) {
    return session.access_token;
  }
  if (!session.refresh_token) return null;

  const SHOP_ID = Deno.env.get("SHOPIFY_SHOP_ID")!;
  const CLIENT_ID = Deno.env.get("SHOPIFY_CLIENT_ID")!;
  const CLIENT_SECRET = Deno.env.get("SHOPIFY_CLIENT_SECRET")!;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: session.refresh_token,
  });

  const resp = await fetch(
    `https://shopify.com/authentication/${SHOP_ID}/oauth/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      },
      body: body.toString(),
    },
  );
  if (!resp.ok) return null;
  const t = await resp.json() as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
  await supabase
    .from("customer_sessions")
    .update({
      access_token: t.access_token,
      refresh_token: t.refresh_token ?? session.refresh_token,
      expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    })
    .eq("session_id", session.session_id);
  return t.access_token;
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    // 1. Authorize via the session cookie — NEVER trust a customer id from the
    //    body. The customer we update is whoever the cookie authenticates as.
    const sessionId = getSessionId(req);
    if (!sessionId) return json({ error: "Unauthenticated" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session } = await supabase
      .from("customer_sessions")
      .select("session_id, access_token, refresh_token, expires_at")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (!session) return json({ error: "Session not found" }, 401);

    const accessToken = await refreshIfNeeded(supabase, session as any);
    if (!accessToken) return json({ error: "Session expired" }, 401);

    // 2. Resolve the authoritative customer GID from the live Shopify session.
    const SHOP_ID = Deno.env.get("SHOPIFY_SHOP_ID")!;
    const caaResp = await fetch(
      `https://shopify.com/${SHOP_ID}/account/customer/api/${CAA_API_VERSION}/graphql`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": accessToken },
        body: JSON.stringify({ query: `query { customer { id } }` }),
      },
    );
    const caaJson = await caaResp.json();
    const customerGid: string | null = caaJson?.data?.customer?.id ?? null;
    if (!customerGid) return json({ error: "Could not resolve customer" }, 401);

    // 3. Read the reviewed form fields.
    const body = await req.json().catch(() => ({}));
    const s = (v: unknown) => String(v ?? "").trim();
    const firstName = s(body.first_name);
    const lastName = s(body.last_name);
    const shopName = s(body.shop_name);
    const phone = s(body.phone);
    const country = s(body.country);
    const state = s(body.state);
    const city = s(body.city);
    const shippingAddress = s(body.shipping_address);
    const businessTax = s(body.business_tax_number);
    const otherBusiness = s(body.other_business_number);
    const message = s(body.message);

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
        `https://${domain}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
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

    // 4. Find the existing default address (Admin GID) so we update in place.
    const lookup = await admin(
      `query($id: ID!) { customer(id: $id) { id defaultAddress { id } } }`,
      { id: customerGid },
    );
    if (lookup?.errors) {
      console.error("customer lookup errors:", JSON.stringify(lookup.errors));
      return json({ error: "Shopify lookup failed" }, 502);
    }
    const addressId: string | null =
      lookup?.data?.customer?.defaultAddress?.id ?? null;

    // 5. Update the customer record: name, (valid) phone, note, metafields.
    const metafields: Array<Record<string, string>> = [];
    if (businessTax)
      metafields.push({
        namespace: "wholesale",
        key: "business_tax_number",
        type: "single_line_text_field",
        value: businessTax.slice(0, 100),
      });
    if (otherBusiness)
      metafields.push({
        namespace: "wholesale",
        key: "other_business_number",
        type: "single_line_text_field",
        value: otherBusiness.slice(0, 100),
      });

    const customerInput: Record<string, unknown> = { id: customerGid };
    if (firstName) customerInput.firstName = firstName;
    if (lastName) customerInput.lastName = lastName;
    const validPhone = e164(phone);
    if (validPhone) customerInput.phone = validPhone;
    if (message) customerInput.note = message.slice(0, 2000);
    if (metafields.length) customerInput.metafields = metafields;

    const updRes = await admin(
      `mutation($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer { id }
          userErrors { field message }
        }
      }`,
      { input: customerInput },
    );
    if (updRes?.errors) {
      console.error("customerUpdate errors:", JSON.stringify(updRes.errors));
      return json({ error: "Shopify update failed" }, 502);
    }
    const updErrors = updRes?.data?.customerUpdate?.userErrors ?? [];
    if (updErrors.length > 0) {
      console.error("customerUpdate userErrors:", JSON.stringify(updErrors));
      return json({ error: updErrors[0]?.message ?? "Could not update customer" }, 400);
    }

    // 6. Upsert the default address. shop_name -> company and country -> country
    //    so the completeness gate (which reads defaultAddress) passes next load.
    const addr: Record<string, unknown> = {};
    if (shopName) addr.company = shopName;
    if (shippingAddress) addr.address1 = shippingAddress.slice(0, 255);
    if (city) addr.city = city;
    if (state) addr.province = state;
    if (validPhone) addr.phone = validPhone;
    const cc = toCountryCode(country);
    if (cc) addr.countryCode = cc;
    if (firstName) addr.firstName = firstName;
    if (lastName) addr.lastName = lastName;

    if (Object.keys(addr).length > 0) {
      let addrRes: any;
      if (addressId) {
        addrRes = await admin(
          `mutation($customerId: ID!, $addressId: ID!, $address: MailingAddressInput!) {
            customerAddressUpdate(customerId: $customerId, addressId: $addressId, address: $address, setAsDefault: true) {
              address { id }
              userErrors { field message }
            }
          }`,
          { customerId: customerGid, addressId, address: addr },
        );
        const e = addrRes?.data?.customerAddressUpdate?.userErrors ?? [];
        if (addrRes?.errors || e.length > 0) {
          console.error("addressUpdate problem:", JSON.stringify(addrRes?.errors ?? e));
          return json({ error: e[0]?.message ?? "Could not update address" }, 400);
        }
      } else {
        addrRes = await admin(
          `mutation($customerId: ID!, $address: MailingAddressInput!) {
            customerAddressCreate(customerId: $customerId, address: $address, setAsDefault: true) {
              address { id }
              userErrors { field message }
            }
          }`,
          { customerId: customerGid, address: addr },
        );
        const e = addrRes?.data?.customerAddressCreate?.userErrors ?? [];
        if (addrRes?.errors || e.length > 0) {
          console.error("addressCreate problem:", JSON.stringify(addrRes?.errors ?? e));
          return json({ error: e[0]?.message ?? "Could not create address" }, 400);
        }
      }
    }

    return json({ ok: true });
  } catch (e) {
    console.error("update-shopify-customer error:", (e as Error).message);
    return json({ error: "Unexpected error" }, 500);
  }
});
