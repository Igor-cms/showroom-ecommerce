// Creates a Shopify Storefront cart ON THE SERVER so the logged-in customer's
// identity can be attached to it.
//
// Why this exists: the browser can create a cart on its own (and still does for
// anonymous visitors), but it has no way to prove WHO is shopping. Shopify only
// evaluates customer-restricted discount codes when the cart carries a
// buyerIdentity.customerAccessToken. That token is the Customer Account API
// access token we already hold in `customer_sessions` — it must never reach the
// browser, so the cart is built here instead.
//
// The session is identified exactly like every other customer endpoint: the
// x-session-id header (or the session cookie). Nothing about the caller's
// identity is read from the request body.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, getSessionId } from "../_shared/customerCors.ts";

const serve = Deno.serve;

// Same store the browser talks to (see src/lib/shopifyStorefront.ts). Hardcoded
// on purpose: a mismatch here would silently quote and check out against a
// different catalogue.
const DOMAIN = "40c504-61.myshopify.com";
const API_VERSION = "2025-01";
const CUSTOMER_API_VERSION = "2024-10";

const CART_CREATE = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        discountCodes { code applicable }
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount { amount currencyCode }
        }
      }
      userErrors { field message }
    }
  }
`;

interface Line {
  merchandiseId: string;
  quantity: number;
}

function parseLines(raw: unknown): Line[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) {
    throw new Error("invalid_lines");
  }
  return raw.map((l) => {
    const id = (l as Line)?.merchandiseId;
    const qty = (l as Line)?.quantity;
    if (
      typeof id !== "string" ||
      !id.startsWith("gid://shopify/ProductVariant/") ||
      id.length > 120 ||
      typeof qty !== "number" ||
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > 999
    ) {
      throw new Error("invalid_lines");
    }
    return { merchandiseId: id, quantity: qty };
  });
}

function parseCodes(raw: unknown): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 5) throw new Error("invalid_codes");
  return raw.map((c) => {
    if (typeof c !== "string" || !c.trim() || c.length > 64) {
      throw new Error("invalid_codes");
    }
    return c.trim();
  });
}

function parseAttributes(raw: unknown): Array<{ key: string; value: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (a) =>
        a && typeof a.key === "string" && typeof a.value === "string" &&
        a.key.length <= 64 && a.value.length <= 256,
    )
    .slice(0, 10)
    .map((a) => ({ key: a.key, value: a.value }));
}

/** Mirrors customer-account-get: keeps the Shopify token usable. */
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
        refresh_token: session.refresh_token,
      }).toString(),
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

async function storefront(
  token: string,
  input: Record<string, unknown>,
): Promise<{ cart: unknown; userErrors: Array<{ message: string }> }> {
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query: CART_CREATE, variables: { input } }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "));
  }
  return json.data.cartCreate;
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const STOREFRONT_TOKEN = Deno.env.get("SHOPIFY_STOREFRONT_TOKEN");
    if (!STOREFRONT_TOKEN) return json({ error: "not_configured" }, 500);

    const body = await req.json().catch(() => ({}));

    let lines: Line[];
    let discountCodes: string[];
    try {
      lines = parseLines(body.lines);
      discountCodes = parseCodes(body.discountCodes);
    } catch (e) {
      return json({ error: (e as Error).message }, 400);
    }
    const attributes = parseAttributes(body.attributes);
    const countryCode =
      typeof body.countryCode === "string" && /^[A-Z]{2}$/.test(body.countryCode)
        ? body.countryCode
        : null;

    // ── Identity ────────────────────────────────────────────────────────────
    // Resolved from the session only. A caller cannot ask to be somebody else:
    // there is no email/customer field read from the request body.
    let customerAccessToken: string | null = null;
    let email: string | null = null;

    const sessionId = getSessionId(req);
    if (sessionId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: session } = await supabase
        .from("customer_sessions")
        .select("session_id, access_token, refresh_token, expires_at, email")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (session) {
        const token = await refreshIfNeeded(supabase, session as never);
        if (token) {
          customerAccessToken = token;
          email = (session as { email: string | null }).email;
        }
      }
    }

    const buyerIdentity: Record<string, unknown> = {};
    if (countryCode) buyerIdentity.countryCode = countryCode;
    if (email) buyerIdentity.email = email;
    if (customerAccessToken) {
      buyerIdentity.customerAccessToken = customerAccessToken;
    }

    const input: Record<string, unknown> = { lines };
    if (discountCodes.length) input.discountCodes = discountCodes;
    if (attributes.length) input.attributes = attributes;
    if (Object.keys(buyerIdentity).length) input.buyerIdentity = buyerIdentity;

    let result = await storefront(STOREFRONT_TOKEN, input);
    let identified = !!customerAccessToken;

    // Never let identity break a checkout: if Shopify rejects the customer
    // token (revoked, wrong token type on this store), rebuild the cart
    // anonymously so the customer can still pay.
    if (result.userErrors?.length && customerAccessToken) {
      console.warn(
        "cart with customerAccessToken rejected:",
        result.userErrors.map((e) => e.message).join("; "),
      );
      const fallback = { ...input };
      const bi = { ...buyerIdentity };
      delete bi.customerAccessToken;
      if (Object.keys(bi).length) fallback.buyerIdentity = bi;
      else delete fallback.buyerIdentity;
      result = await storefront(STOREFRONT_TOKEN, fallback);
      identified = false;
    }

    if (result.userErrors?.length) {
      return json(
        { error: result.userErrors.map((e) => e.message).join("; ") },
        400,
      );
    }
    if (!result.cart) return json({ error: "no_cart" }, 502);

    return json({ cart: result.cart, identified });
  } catch (e) {
    console.error("shopify-cart error:", (e as Error).message);
    return json({ error: "cart_failed" }, 500);
  }
});

// CUSTOMER_API_VERSION is kept for parity with the other customer functions.
void CUSTOMER_API_VERSION;
