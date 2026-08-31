import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, getSessionId } from "../_shared/customerCors.ts";

/**
 * The signed-in customer's Shopify store credit balance, for display in the
 * cart. Read-only: it never applies the credit — that happens at the Shopify
 * checkout once the customer signs in there.
 *
 * WHOSE balance is decided by the SESSION, never by the request body. This used
 * to take an { email } (or { phone }) and hand back that person's balance, with
 * verify_jwt off and CORS open to any origin — so anyone who found the URL
 * could ask for any address and learn both whether it belonged to a Native
 * customer and how much credit they held. Enumerating the customer list was a
 * matter of replaying a list of emails against it.
 *
 * The identity now comes the same way update-shopify-customer takes it: resolve
 * the session, ask the Customer Account API who that session belongs to, and
 * look up only that customer. An attacker with the URL and no session gets a
 * 401; one with a session gets their own balance and nothing else.
 */

// Store credit lives in the Admin API; the session's own identity comes from
// the Customer Account API. Both versions match update-shopify-customer.
const ADMIN_API_VERSION = "2026-04";
const CAA_API_VERSION = "2024-10";

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

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    // 1. Who is asking? Only the session answers that. Anything in the body is
    //    ignored — deliberately, since trusting it was the original flaw.
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

    const accessToken = await refreshIfNeeded(supabase, session as never);
    if (!accessToken) return json({ error: "Session expired" }, 401);

    // 2. Resolve the authoritative customer id from the live Shopify session.
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

    // 3. Read that one customer's balance. Looking them up BY ID rather than
    //    searching by email is what makes returning the wrong person's balance
    //    impossible rather than merely unlikely.
    const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
    const adminToken =
      Deno.env.get("SHOPIFY_ADMIN_TOKEN") ??
      Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
    if (!domain || !adminToken) {
      console.error("Missing SHOPIFY_STORE_DOMAIN or admin token");
      return json({ error: "Server not configured" }, 500);
    }

    const adminResp = await fetch(
      `https://${domain}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": adminToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query customerCredit($id: ID!) {
            customer(id: $id) {
              id
              storeCreditAccounts(first: 10) {
                edges { node { balance { amount currencyCode } } }
              }
            }
          }`,
          variables: { id: customerGid },
        }),
      },
    );

    const adminJson = await adminResp.json() as {
      data?: {
        customer: {
          storeCreditAccounts: {
            edges: Array<{ node: { balance: { amount: string; currencyCode: string } } }>;
          };
        } | null;
      };
      errors?: Array<{ message: string }>;
    };

    if (adminJson.errors?.length) {
      console.error("Store credit GraphQL errors:", adminJson.errors);
      return json({ error: "GraphQL error" }, 500);
    }

    const balances = adminJson.data?.customer?.storeCreditAccounts.edges ?? [];
    const creditAmount = balances.reduce(
      (sum, e) => sum + parseFloat(e.node.balance.amount || "0"),
      0,
    );
    const currencyCode = balances[0]?.node.balance.currencyCode ?? "USD";

    return json({ found: true, creditAmount, currencyCode });
  } catch (error) {
    console.error("Error in get-customer-credit:", (error as Error).message);
    return json({ error: (error as Error).message }, 500);
  }
});
