import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, getSessionId } from "../_shared/customerCors.ts";

const API_VERSION = "2024-10";

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

  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session } = await supabase
      .from("customer_sessions")
      .select("session_id, access_token, refresh_token, expires_at")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const accessToken = await refreshIfNeeded(supabase, session as any);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

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
              id
              displayName
              firstName
              lastName
              emailAddress { emailAddress }
              phoneNumber { phoneNumber }
              defaultAddress {
                address1
                address2
                city
                province
                country
                zip
                company
                phoneNumber
              }
              orders(first: 5, sortKey: PROCESSED_AT, reverse: true) {
                edges {
                  node {
                    id
                    name
                    processedAt
                    totalPrice { amount currencyCode }
                    fulfillmentStatus
                  }
                }
              }
            }
          }`,
        }),
      },
    );

    const json = await gql.json();
    if (json.errors) {
      console.error("Customer Account GraphQL errors:", json.errors);
      return new Response(JSON.stringify({ error: "GraphQL error" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const customer = json.data?.customer ?? null;

    // Wholesale approval status lives in Shopify customer tags, which the
    // Customer Account API does not expose. Look them up via the Admin API.
    // Degrade gracefully to null (never break login) if anything is missing.
    if (customer?.id) {
      try {
        const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
        const adminTok =
          Deno.env.get("SHOPIFY_ADMIN_TOKEN") ??
          Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
        if (domain && adminTok) {
          const adminResp = await fetch(
            `https://${domain}/admin/api/${API_VERSION}/graphql.json`,
            {
              method: "POST",
              headers: {
                "X-Shopify-Access-Token": adminTok,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: `query($id: ID!) { customer(id: $id) { tags } }`,
                variables: { id: customer.id },
              }),
            },
          );
          const adminJson = await adminResp.json();
          const tags: string[] = adminJson?.data?.customer?.tags ?? [];

          // Read-only: the wholesale status is whatever the tags say, and
          // nothing here writes a tag back.
          //
          // This used to auto-tag any untagged customer with no orders as
          // wholesale-pending, on the grounds that an untagged self-signup
          // would otherwise "slip straight into the portal". That stopped
          // being true when the gate was tightened to require an explicit
          // wholesale-approved tag (see WholesaleCopy: a null status now
          // lands on the password gate, not inside). Once /signup existed,
          // the leftover safety net was tagging ordinary retail customers —
          // who never applied — into the wholesale approval queue, where an
          // accidental Approve would have handed them wholesale pricing.
          //
          // Genuine applicants are tagged by wholesale-register itself, on
          // both the existing-customer and new-customer paths, so nothing
          // depends on this.
          const status: "approved" | "rejected" | "pending" | null =
            tags.includes("wholesale-approved")
              ? "approved"
              : tags.includes("wholesale-rejected")
              ? "rejected"
              : tags.includes("wholesale-pending")
              ? "pending"
              : null;

          customer.wholesaleStatus = status;
        } else {
          customer.wholesaleStatus = null;
        }
      } catch (e) {
        console.error("wholesale status lookup failed:", (e as Error).message);
        customer.wholesaleStatus = null;
      }
    }

    return new Response(JSON.stringify({ customer }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("customer-account-get error:", (e as Error).message);
    return new Response(JSON.stringify({ error: "Failed" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
