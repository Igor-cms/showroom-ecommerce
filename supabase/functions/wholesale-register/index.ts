import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, getSessionId } from "../_shared/customerCors.ts";
import { toCountryCode } from "../_shared/countryCodes.ts";

// Customer Account API version used to resolve who the caller is logged in as.
// Must match the version update-shopify-customer talks to.
const CAA_API_VERSION = "2024-10";

function e164(phone: string): string | null {
  const p = phone.trim().replace(/[\s()-]/g, "");
  return /^\+[1-9]\d{6,14}$/.test(p) ? p : null;
}

// A valid wholesale-password JWT (issued by verify-wholesale-password, signed
// with WHOLESALE_PASSWORD) means the applicant is pre-approved: having the
// password IS the approval. Verified server-side so it can't be forged.
async function isValidWholesaleToken(token: unknown): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const secret = Deno.env.get("WHOLESALE_PASSWORD");
  if (!secret) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const p = await verify(token, key, "HS256");
    return p.access === "wholesale" && (!p.exp || (p.exp as number) > Date.now() / 1000);
  } catch {
    return false;
  }
}

// Resolve the customer GID the caller is authenticated as, from their Shopify
// session (x-session-id header or cookie). Returns null when there is no valid
// session. This is how we PROVE the requester owns an email before touching an
// existing customer — the same session-cookie authorization that
// update-shopify-customer relies on.
async function resolveSessionCustomerGid(req: Request): Promise<string | null> {
  const sessionId = getSessionId(req);
  if (!sessionId) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return null;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: session } = await supabase
    .from("customer_sessions")
    .select("session_id, access_token, refresh_token, expires_at")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!session) return null;

  const SHOP_ID = Deno.env.get("SHOPIFY_SHOP_ID");
  if (!SHOP_ID) return null;

  // Refresh the Shopify access token if it is at/near expiry.
  let accessToken: string | null = (session as any).access_token ?? null;
  const expiresAt = new Date((session as any).expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now() + 30_000) {
    accessToken = null;
    const refreshToken = (session as any).refresh_token as string | null;
    const CLIENT_ID = Deno.env.get("SHOPIFY_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("SHOPIFY_CLIENT_SECRET");
    if (refreshToken && CLIENT_ID && CLIENT_SECRET) {
      const resp = await fetch(
        `https://shopify.com/authentication/${SHOP_ID}/oauth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: CLIENT_ID,
            refresh_token: refreshToken,
          }).toString(),
        },
      );
      if (resp.ok) {
        const t = await resp.json() as {
          access_token: string;
          expires_in: number;
          refresh_token?: string;
        };
        accessToken = t.access_token;
        await supabase
          .from("customer_sessions")
          .update({
            access_token: t.access_token,
            refresh_token: t.refresh_token ?? refreshToken,
            expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
          })
          .eq("session_id", (session as any).session_id);
      }
    }
  }
  if (!accessToken) return null;

  const caaResp = await fetch(
    `https://shopify.com/${SHOP_ID}/account/customer/api/${CAA_API_VERSION}/graphql`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": accessToken },
      body: JSON.stringify({ query: `query { customer { id } }` }),
    },
  );
  const caaJson = await caaResp.json().catch(() => null);
  return caaJson?.data?.customer?.id ?? null;
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
    const body = await req.json().catch(() => ({}));
    const s = (v: unknown) => String(v ?? "").trim();
    const email = s(body.email).toLowerCase();
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

    // Pre-approved when the wholesale password token is valid (verified server
    // side). The wholesale password itself is the approval for this flow.
    const approved = await isValidWholesaleToken(body.wholesale_token);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid email" }, 400);
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

    // Shared field mappings.
    const validPhone = e164(phone);
    const metafields: Array<Record<string, string>> = [];
    if (businessTax)
      metafields.push({ namespace: "wholesale", key: "business_tax_number", type: "single_line_text_field", value: businessTax.slice(0, 100) });
    if (otherBusiness)
      metafields.push({ namespace: "wholesale", key: "other_business_number", type: "single_line_text_field", value: otherBusiness.slice(0, 100) });

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
    const hasAddr = Object.keys(addr).length > 0;

    // 1. Find an existing customer by email.
    const search = await admin(
      `query($q: String!) {
        customers(first: 1, query: $q) {
          edges { node { id tags defaultAddress { id } } }
        }
      }`,
      { q: `email:${email}` },
    );
    if (search?.errors) {
      console.error("customer search errors:", JSON.stringify(search.errors));
      return json({ error: "Shopify lookup failed" }, 502);
    }
    const existing = search?.data?.customers?.edges?.[0]?.node ?? null;

    if (existing) {
      const customerGid: string = existing.id;
      const tags: string[] = Array.isArray(existing.tags) ? existing.tags : [];

      // SECURITY: an existing customer's data must never be mutated just because
      // someone typed their email. Require a Shopify session that resolves to
      // THIS same customer — proof the requester owns the login. Without it,
      // write nothing (no fields, no tags, no address) and tell the client to
      // send the user through Shopify login first. The reviewed details are then
      // re-submitted WITH a session once the login is confirmed.
      const authedGid = await resolveSessionCustomerGid(req);
      if (!authedGid || authedGid !== customerGid) {
        return json({ ok: false, requiresAuth: true });
      }

      // Update profile fields + metafields (does not touch tags).
      const input: Record<string, unknown> = { id: customerGid };
      if (firstName) input.firstName = firstName;
      if (lastName) input.lastName = lastName;
      if (validPhone) input.phone = validPhone;
      if (message) input.note = message.slice(0, 2000);
      if (metafields.length) input.metafields = metafields;
      const upd = await admin(
        `mutation($input: CustomerInput!) {
          customerUpdate(input: $input) { customer { id } userErrors { field message } }
        }`,
        { input },
      );
      const updErr = upd?.data?.customerUpdate?.userErrors ?? [];
      if (upd?.errors || updErr.length) {
        console.error("customerUpdate problem:", JSON.stringify(upd?.errors ?? updErr));
        return json({ error: updErr[0]?.message ?? "Could not update customer" }, 400);
      }

      // Set wholesale status. A valid wholesale password = pre-approved, so tag
      // approved and clear any pending/rejected. Otherwise mark pending, but
      // never downgrade an already-approved customer.
      if (approved) {
        if (tags.includes("wholesale-pending") || tags.includes("wholesale-rejected")) {
          await admin(
            `mutation($id: ID!, $tags: [String!]!) {
              tagsRemove(id: $id, tags: $tags) { userErrors { field message } }
            }`,
            { id: customerGid, tags: ["wholesale-pending", "wholesale-rejected"] },
          );
        }
        if (!tags.includes("wholesale-approved")) {
          const tg = await admin(
            `mutation($id: ID!, $tags: [String!]!) {
              tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
            }`,
            { id: customerGid, tags: ["wholesale-approved"] },
          );
          const tgErr = tg?.data?.tagsAdd?.userErrors ?? [];
          if (tg?.errors || tgErr.length) {
            console.error("tagsAdd problem:", JSON.stringify(tg?.errors ?? tgErr));
            return json({ error: tgErr[0]?.message ?? "Could not tag customer" }, 400);
          }
        }
      } else if (!tags.includes("wholesale-approved")) {
        const tg = await admin(
          `mutation($id: ID!, $tags: [String!]!) {
            tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
          }`,
          { id: customerGid, tags: ["wholesale-pending"] },
        );
        const tgErr = tg?.data?.tagsAdd?.userErrors ?? [];
        if (tg?.errors || tgErr.length) {
          console.error("tagsAdd problem:", JSON.stringify(tg?.errors ?? tgErr));
          return json({ error: tgErr[0]?.message ?? "Could not tag customer" }, 400);
        }
      }

      // Address upsert.
      if (hasAddr) {
        if (existing.defaultAddress?.id) {
          const a = await admin(
            `mutation($addressId: ID!, $address: MailingAddressInput!) {
              customerAddressUpdate(addressId: $addressId, address: $address, setAsDefault: true) {
                customerAddress { id } userErrors { field message }
              }
            }`,
            { addressId: existing.defaultAddress.id, address: addr },
          );
          const e = a?.data?.customerAddressUpdate?.userErrors ?? [];
          if (a?.errors || e.length) console.error("addressUpdate problem:", JSON.stringify(a?.errors ?? e));
        } else {
          const a = await admin(
            `mutation($customerId: ID!, $address: MailingAddressInput!) {
              customerAddressCreate(customerId: $customerId, address: $address, setAsDefault: true) {
                customerAddress { id } userErrors { field message }
              }
            }`,
            { customerId: customerGid, address: addr },
          );
          const e = a?.data?.customerAddressCreate?.userErrors ?? [];
          if (a?.errors || e.length) console.error("addressCreate problem:", JSON.stringify(a?.errors ?? e));
        }
      }

      return json({ ok: true, created: false, status: approved ? "approved" : "pending" });
    }

    // 2. No existing customer — create one, pending, with everything in one shot.
    const createInput: Record<string, unknown> = {
      email,
      tags: [approved ? "wholesale-approved" : "wholesale-pending"],
    };
    if (firstName) createInput.firstName = firstName;
    if (lastName) createInput.lastName = lastName;
    if (validPhone) createInput.phone = validPhone;
    if (message) createInput.note = message.slice(0, 2000);
    if (metafields.length) createInput.metafields = metafields;
    if (hasAddr) createInput.addresses = [addr];

    const created = await admin(
      `mutation($input: CustomerInput!) {
        customerCreate(input: $input) { customer { id } userErrors { field message } }
      }`,
      { input: createInput },
    );
    const createErr = created?.data?.customerCreate?.userErrors ?? [];
    if (created?.errors || createErr.length) {
      console.error("customerCreate problem:", JSON.stringify(created?.errors ?? createErr));
      return json({ error: createErr[0]?.message ?? "Could not create customer" }, 400);
    }

    return json({ ok: true, created: true, status: approved ? "approved" : "pending" });
  } catch (e) {
    console.error("wholesale-register error:", (e as Error).message);
    return json({ error: "Unexpected error" }, 500);
  }
});
