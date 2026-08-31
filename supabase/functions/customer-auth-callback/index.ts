import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, sessionCookie } from "../_shared/customerCors.ts";

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split(".");
  if (parts.length < 2) return {};
  const pad = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
  const b64 = pad.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return JSON.parse(atob(b64));
  } catch {
    return {};
  }
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { code, state } = await req.json().catch(() => ({}));
    if (!code || !state) {
      return new Response(JSON.stringify({ ok: false, error: "missing_params" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const SHOP_ID = "89741328674";
    const CLIENT_ID = "e06af9f3-5f50-402b-bb65-1c0f7d646f74";
    const CLIENT_SECRET: string | undefined = undefined;
    const REDIRECT_URI = "https://wholesale.thenativecoffeecompany.com/auth/callback";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error: selErr } = await supabase
      .from("auth_sessions")
      .select("code_verifier, expires_at, email")
      .eq("state", state)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!row) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_state" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await supabase.from("auth_sessions").delete().eq("state", state);
      return new Response(JSON.stringify({ ok: false, error: "state_expired" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    // one-time use
    await supabase.from("auth_sessions").delete().eq("state", state);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code,
      code_verifier: row.code_verifier,
    });

    // Support both confidential (with secret) and public PKCE-only clients.
    const tokenHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (CLIENT_SECRET) {
      tokenHeaders["Authorization"] = "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    }

    const tokenResp = await fetch(
      `https://shopify.com/authentication/${SHOP_ID}/oauth/token`,
      { method: "POST", headers: tokenHeaders, body: body.toString() },
    );

    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      console.error("Token exchange failed:", tokenResp.status, txt);
      return new Response(JSON.stringify({ ok: false, error: "token_exchange_failed" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }


    const tokens = await tokenResp.json() as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      id_token?: string;
    };

    const claims = tokens.id_token ? decodeJwtPayload(tokens.id_token) : {};
    const customer_id = (claims.sub as string) ?? null;
    const email = (claims.email as string) ?? null;

    // Guard: the account the user actually authenticated as must match the
    // email they typed in the lookup step. Without this, a stale Shopify
    // session for a different account would silently log them in as the wrong
    // person (and prefill the wrong profile on /wholesale-request).
    const expectedEmail = (row.email ?? "").trim().toLowerCase();
    const actualEmail = (email ?? "").trim().toLowerCase();
    if (expectedEmail && actualEmail && expectedEmail !== actualEmail) {
      console.warn(
        `Email mismatch on callback: expected ${expectedEmail}, got ${actualEmail}`,
      );
      return new Response(
        JSON.stringify({ ok: false, error: "email_mismatch" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const expires_at = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { data: inserted, error: insErr } = await supabase
      .from("customer_sessions")
      .insert({
        customer_id,
        email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        id_token: tokens.id_token ?? null,
        expires_at,
      })
      .select("session_id")
      .single();
    if (insErr) throw insErr;

    // Return the session id in the body so the frontend can persist it in
    // localStorage and authenticate via the x-session-id header. The cookie is
    // still set for browsers that accept it, but the header path is what keeps
    // login working where third-party cookies are blocked (Safari/incognito).
    return new Response(
      JSON.stringify({ ok: true, session_id: inserted.session_id }),
      {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "application/json",
          "Set-Cookie": sessionCookie(inserted.session_id, tokens.expires_in),
        },
      },
    );
  } catch (e) {
    console.error("customer-auth-callback error:", (e as Error).message);
    return new Response(JSON.stringify({ ok: false, error: "callback_failed" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
