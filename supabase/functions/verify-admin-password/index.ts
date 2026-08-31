import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// HMAC key derived from the admin password secret. Mirrors verify-wholesale-password.
const getKey = async () => {
  const secret = Deno.env.get("ADMIN_PASSWORD") || "fallback-admin-secret";
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, token } = await req.json();

    // Verify mode: is this admin token still valid?
    if (token) {
      try {
        const key = await getKey();
        const payload = await verify(token, key, "HS256");
        if (payload.access !== "admin") {
          return new Response(
            JSON.stringify({ valid: false, error: "Not an admin token" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
          );
        }
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return new Response(
            JSON.stringify({ valid: false, error: "Token expired" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
          );
        }
        return new Response(
          JSON.stringify({ valid: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch {
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid token" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
        );
      }
    }

    // Authentication mode: validate the admin password and issue a token.
    const correctPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!correctPassword) {
      console.error("ADMIN_PASSWORD not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    if (password !== correctPassword) {
      return new Response(
        JSON.stringify({ error: "Incorrect password" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const key = await getKey();
    const jwt = await create(
      { alg: "HS256", typ: "JWT" },
      {
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
        iat: Math.floor(Date.now() / 1000),
        access: "admin",
      },
      key,
    );

    return new Response(
      JSON.stringify({ token: jwt, expiresIn: 7 * 24 * 60 * 60 * 1000 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in verify-admin-password:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
