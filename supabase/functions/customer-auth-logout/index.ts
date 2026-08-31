import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders, clearCookie, getSessionId } from "../_shared/customerCors.ts";

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const sessionId = getSessionId(req);
    if (sessionId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const { data: session } = await supabase
        .from("customer_sessions")
        .select("id_token")
        .eq("session_id", sessionId)
        .maybeSingle();

      // Best-effort revoke at Shopify
      if (session?.id_token) {
        const SHOP_ID = Deno.env.get("SHOPIFY_SHOP_ID");
        if (SHOP_ID) {
          try {
            await fetch(
              `https://shopify.com/authentication/${SHOP_ID}/logout?id_token_hint=${encodeURIComponent(session.id_token as string)}`,
              { method: "GET" },
            );
          } catch (_) { /* ignore */ }
        }
      }

      await supabase.from("customer_sessions").delete().eq("session_id", sessionId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Set-Cookie": clearCookie(),
      },
    });
  } catch (e) {
    console.error("customer-auth-logout error:", (e as Error).message);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Set-Cookie": clearCookie(),
      },
    });
  }
});
