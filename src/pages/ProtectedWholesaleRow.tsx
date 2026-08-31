import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import WholesaleRow from "./WholesaleRow";
import LoginBackground from "@/components/wholesale-copy/LoginBackground";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { supabase } from "@/integrations/supabase/client";
import { canEnterWholesalePortal } from "@/lib/wholesaleAccess";

/**
 * Route guard for /wholesale-row.
 *
 * The portal used to be reachable by typing the URL: /wholesale-copy holds the
 * whole approval gate, but the destination it redirects to had no guard of its
 * own, so anyone could skip straight past the password, the Shopify login and
 * the approval check and read the wholesale catalogue and its prices.
 *
 * This deliberately does NOT re-implement the gate's decision tree. It answers
 * one question — may this visitor be here? — and, when the answer is no, hands
 * them to /wholesale-copy, which remains the single place that decides WHICH
 * screen they should see (password, login, pending, rejected, profile update).
 * The predicate itself lives in wholesaleAccess.ts and is shared with that
 * page, so the two cannot disagree and bounce the visitor between them.
 */
const ProtectedWholesaleRow = () => {
  const { customer, loading: customerLoading } = useCustomerSession();
  const [passwordOk, setPasswordOk] = useState(false);
  const [passwordChecking, setPasswordChecking] = useState(true);

  // Same token and same verification /wholesale-copy performs — a visitor who
  // entered through the password gate carries this and must not be bounced.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("wholesale-copy-token");
      if (!token) {
        if (!cancelled) setPasswordChecking(false);
        return;
      }
      try {
        const { data } = await supabase.functions.invoke("verify-wholesale-password", {
          body: { token },
        });
        if (!cancelled && data?.valid) setPasswordOk(true);
      } catch {
        // Network/function failure is not proof of anything. Leave passwordOk
        // false: the session's own `wholesale-approved` tag can still admit
        // them, and otherwise they land on the gate rather than in the portal.
      } finally {
        if (!cancelled) setPasswordChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Both checks are async. Redirecting before they settle would throw a
  // legitimate, fully-approved customer back to the gate on every entry, so
  // hold the background until the answer is actually known.
  if (customerLoading || passwordChecking) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-wholesale-bg">
        <LoginBackground />
      </div>
    );
  }

  if (!canEnterWholesalePortal({ customer, passwordOk })) {
    return <Navigate to="/wholesale-copy" replace />;
  }

  return <WholesaleRow />;
};

export default ProtectedWholesaleRow;
