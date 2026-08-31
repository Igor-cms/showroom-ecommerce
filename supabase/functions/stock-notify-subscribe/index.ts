// Records a "notify me when back in stock" signup.
//
// Phase 1: capture only. Rows land in stock_notify_signups with
// mailchimp_status='pending' and nothing is emailed. When Mailchimp is wired
// up later, set MAILCHIMP_ENABLED and fill in syncToMailchimp() below — every
// row already carries the tag it should be given.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, getSessionId } from "../_shared/customerCors.ts";

// Bumped whenever the consent wording on the dialog changes, so an old row is
// always traceable to the exact text that person agreed to.
const CONSENT_TEXT_VERSION = "2026-07-v1";

// Same shape as wholesale-signup-save.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_PER_HOUR = 10;

/** "golden-hour" -> "notify - golden hour". Derived from the handle, not the
 *  title, so it survives the owner renaming the product in Shopify. */
function mailchimpTagFor(handle: string): string {
  return `notify - ${handle.replace(/-/g, " ").trim()}`.slice(0, 100);
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));

    const productHandle = String(body?.productHandle ?? "").trim().slice(0, 200);
    const productTitle = body?.productTitle ? String(body.productTitle).trim().slice(0, 300) : null;
    if (!productHandle) return json({ error: "Missing product" }, 400, cors);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    /* ── Identity ──────────────────────────────────────────────────────────
       When a session is present the email comes from the SERVER, never from
       the request body — otherwise a logged-in user could sign someone else
       up. The client never has to tell us whether it is logged in; the
       absence of a usable session is what produces needsEmail below. */
    let email: string | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;
    let shopifyCustomerId: string | null = null;
    let source: "logged_in" | "anonymous" = "anonymous";

    const sessionId = getSessionId(req);
    if (sessionId) {
      const { data: session } = await supabase
        .from("customer_sessions")
        .select("email, customer_id, expires_at")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (session?.email) {
        email = String(session.email).trim().toLowerCase();
        shopifyCustomerId = session.customer_id ?? null;
        source = "logged_in";
      }
    }

    if (!email) {
      const supplied = String(body?.email ?? "").trim().toLowerCase();
      // No session and nothing typed yet — tell the client to open the dialog.
      if (!supplied) return json({ needsEmail: true }, 200, cors);

      if (!EMAIL_RE.test(supplied)) return json({ error: "Please enter a valid email address." }, 400, cors);

      firstName = String(body?.firstName ?? "").trim().slice(0, 100);
      if (!firstName) return json({ error: "Please enter your first name." }, 400, cors);

      lastName = body?.lastName ? String(body.lastName).trim().slice(0, 100) : null;

      // Anonymous signups are the only path that can name an arbitrary
      // address, so consent must be explicit here.
      if (body?.consent !== true) return json({ error: "Please accept to be emailed about this coffee." }, 400, cors);

      email = supplied;
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("cf-connecting-ip") ??
      null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

    /* ── Rate limit ────────────────────────────────────────────────────────
       Anonymous only: a logged-in signup is already bounded by the session.
       Counts DISTINCT addresses from this IP in the last hour, so a household
       behind one NAT can still each sign up while a script spraying addresses
       is stopped. */
    if (source === "anonymous" && ip) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("stock_notify_signups")
        .select("email")
        .eq("consent_ip", ip)
        .gte("created_at", since);

      const distinct = new Set((recent ?? []).map((r: { email: string }) => r.email));
      if (!distinct.has(email) && distinct.size >= RATE_LIMIT_PER_HOUR) {
        return json({ error: "Too many signups from this network. Try again later." }, 429, cors);
      }
    }

    // Already on the list for this coffee? Report success without touching the
    // original consent record.
    const { data: existing } = await supabase
      .from("stock_notify_signups")
      .select("id")
      .eq("product_handle", productHandle)
      .eq("email", email)
      .maybeSingle();

    if (existing) return json({ ok: true, alreadySubscribed: true }, 200, cors);

    const { error } = await supabase.from("stock_notify_signups").insert({
      product_handle: productHandle,
      product_title: productTitle,
      email,
      first_name: firstName,
      last_name: lastName,
      source,
      shopify_customer_id: shopifyCustomerId,
      consent_ip: ip,
      consent_user_agent: userAgent,
      consent_text_version: CONSENT_TEXT_VERSION,
      mailchimp_tag: mailchimpTagFor(productHandle),
      mailchimp_status: "pending",
    });

    if (error) {
      // 23505 = someone else inserted the same (handle, email) between our
      // check and this insert. Same outcome for the customer.
      if ((error as { code?: string }).code === "23505") {
        return json({ ok: true, alreadySubscribed: true }, 200, cors);
      }
      throw error;
    }

    /* Mailchimp sync goes here once an account exists. Keep it AFTER the
       insert and never let a failure reach the customer — leave the row at
       mailchimp_status='failed' for a sweep to retry. See the plan for the
       trap: Mailchimp campaigns only deliver to contacts whose status is
       'subscribed'; adding them as 'transactional' sends to nobody.
       if (Deno.env.get("MAILCHIMP_ENABLED") === "true") await syncToMailchimp(...); */

    return json({ ok: true, alreadySubscribed: false }, 200, cors);
  } catch (e) {
    console.error("stock-notify-subscribe error:", (e as Error).message);
    return json({ error: "Couldn't save your request. Please try again." }, 500, cors);
  }
});
