import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate proper CryptoKey for JWT signing
const getKey = async () => {
  const secret = Deno.env.get('WHOLESALE_PASSWORD') || 'fallback-secret-key';
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, token } = await req.json();
    
    // Verify mode: check if token is valid
    if (token) {
      try {
        const key = await getKey();
        const payload = await verify(token, key, "HS256");
        
        // Check if token is expired
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Token expired' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        return new Response(
          JSON.stringify({ valid: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch {
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    }
    
    // Authentication mode: validate password and issue token
    const correctPassword = Deno.env.get('WHOLESALE_PASSWORD');
    
    if (!correctPassword) {
      console.error('WHOLESALE_PASSWORD not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (password !== correctPassword) {
      return new Response(
        JSON.stringify({ error: 'Incorrect password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Password is correct - issue JWT with 7 day expiry
    const key = await getKey();
    const jwt = await create(
      { alg: "HS256", typ: "JWT" },
      { 
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
        iat: Math.floor(Date.now() / 1000),
        access: 'wholesale'
      },
      key
    );
    
    return new Response(
      JSON.stringify({ token: jwt, expiresIn: 7 * 24 * 60 * 60 * 1000 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-wholesale-password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
