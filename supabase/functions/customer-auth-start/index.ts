import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/customerCors.ts";

// Use the runtime's built-in server instead of importing `serve` from
// deno.land/std — the Supabase bundler intermittently times out fetching that
// remote module, and Deno.serve has no external dependency.
const serve = Deno.serve;

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256b64url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return b64url(new Uint8Array(hash));
}

function randomB64Url(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return b64url(arr);
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { email } = await req.json().catch(() => ({ email: "" }));
    const trimmed = (email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const SHOP_ID = "89741328674";
    const CLIENT_ID = "e06af9f3-5f50-402b-bb65-1c0f7d646f74";
    const REDIRECT_URI = "https://wholesale.thenativecoffeecompany.com/auth/callback";

    const code_verifier = randomB64Url(32);
    const code_challenge = await sha256b64url(code_verifier);
    const state = randomB64Url(32);
    const nonce = randomB64Url(32);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase.from("auth_sessions").insert({
      state,
      code_verifier,
      nonce,
      email: trimmed,
    });
    if (error) throw error;

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      scope: "openid email customer-account-api:full",
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      state,
      nonce,
      code_challenge,
      code_challenge_method: "S256",
      login_hint: trimmed,
      // Force a fresh login screen every time. Without this, an existing
      // Shopify customer session (possibly from a DIFFERENT account) is
      // silently reused and the user is authenticated as the wrong account.
      prompt: "login",
    });

    const authorize_url = `https://shopify.com/authentication/${SHOP_ID}/oauth/authorize?${params.toString()}`;

    return new Response(JSON.stringify({ authorize_url }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("customer-auth-start error:", (e as Error).message);
    return new Response(JSON.stringify({ error: "Failed to start auth" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
