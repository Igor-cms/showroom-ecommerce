import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, getSessionId } from "../_shared/customerCors.ts";

/* =========================================================================
 *  customer-orders-get — the authenticated customer's order history, WITH
 *  line items (what was bought, which variant, how many).
 *
 *  Deliberately separate from customer-account-get instead of extending it.
 *  That function backs the whole session: every page asks it "who am I?", and
 *  a GraphQL query is all-or-nothing, so one bad field there would log every
 *  customer out. Keeping the heavier orders query in its own function means
 *  the worst case here is an empty order history.
 *
 *  Variant/product ids come back from Shopify as GIDs
 *  (gid://shopify/ProductVariant/123) but the storefront works in bare numeric
 *  ids — that is what get-shopify-products returns and what the cart stores,
 *  and WholesaleCart re-adds the GID prefix at checkout. Strip here so the
 *  client never has to care which shape it got.
 * ========================================================================= */

const API_VERSION = "2024-10";

/** gid://shopify/ProductVariant/123 -> "123"; passes anything else through. */
function bareId(gid: unknown): string | null {
  const s = String(gid ?? "").trim();
  if (!s) return null;
  const last = s.split("/").pop() ?? "";
  return last || null;
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

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    // Authorize from the session only — never from anything in the body. The
    // orders returned are always the session's own.
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

    const SHOP_ID = Deno.env.get("SHOPIFY_SHOP_ID")!;
    const gql = await fetch(
      `https://shopify.com/${SHOP_ID}/account/customer/api/${API_VERSION}/graphql`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": accessToken,
        },
        body: JSON.stringify({
          query: `query {
            customer {
              orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
                edges {
                  node {
                    id
                    name
                    processedAt
                    totalPrice { amount currencyCode }
                    fulfillmentStatus
                    lineItems(first: 50) {
                      edges {
                        node {
                          title
                          variantTitle
                          quantity
                          variantId
                          productId
                          price { amount currencyCode }
                        }
                      }
                    }
                  }
                }
              }
            }
          }`,
        }),
      },
    );

    const body = await gql.json();
    if (body.errors) {
      console.error("customer-orders-get GraphQL errors:", JSON.stringify(body.errors));
      return json({ error: "GraphQL error" }, 502);
    }

    const edges = body?.data?.customer?.orders?.edges ?? [];
    const orders = edges.map((e: any) => {
      const n = e?.node ?? {};
      return {
        id: n.id,
        name: n.name,
        processedAt: n.processedAt,
        totalPrice: n.totalPrice,
        fulfillmentStatus: n.fulfillmentStatus ?? null,
        lineItems: (n.lineItems?.edges ?? []).map((le: any) => {
          const li = le?.node ?? {};
          return {
            title: li.title ?? "",
            variantTitle: li.variantTitle ?? null,
            quantity: li.quantity ?? 0,
            variantId: bareId(li.variantId),
            productId: bareId(li.productId),
            price: li.price ?? null,
          };
        }),
      };
    });

    return json({ orders });
  } catch (e) {
    console.error("customer-orders-get error:", (e as Error).message);
    return json({ error: "Failed" }, 500);
  }
});
