import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { completeAuth, takeRetailSignup, updateCustomer } from "@/lib/customerAuth";

/**
 * Where to send someone whose login did not complete.
 *
 * It used to be /login, which is closed during the partial launch — a wholesale
 * customer who cancelled at Shopify, or whose state token had expired, landed
 * on a password wall with no way back into the flow. So return them to the page
 * the login was STARTED from, which every entry point records before handing
 * off to Shopify (EmailLookupStep, MenuOverlay, WholesaleRequest all store
 * "/wholesale-copy"). That keeps working unchanged once retail opens, because
 * a retail login records its own origin the same way.
 */
const RETURN_FALLBACK = "/wholesale-copy";

function safeReturnTo(): string {
  const stored = sessionStorage.getItem("post_login_redirect");
  // Same-origin, absolute paths only: this value ends up in a navigation.
  return stored && stored.startsWith("/") && !stored.startsWith("//")
    ? stored
    : RETURN_FALLBACK;
}

function withError(path: string, code: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}error=${encodeURIComponent(code)}`;
}

export default function CustomerAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const shopifyError = params.get("error");

    // Cliente cancelou ou Shopify retornou erro antes da troca de code.
    if (shopifyError) {
      navigate(withError(safeReturnTo(), shopifyError), { replace: true });
      return;
    }
    if (!code || !state) {
      navigate(withError(safeReturnTo(), "missing_params"), { replace: true });
      return;
    }

    (async () => {
      const res = await completeAuth(code, state);
      if (res.ok) {
        // A retail sign-up parked the person's name before this redirect. The
        // session now proves who they are, so write it onto their Shopify
        // customer (server-side, authorized by the session — never by the
        // payload). Failure is not fatal: they are logged in either way and
        // can fill the name in later.
        const signup = takeRetailSignup();
        if (signup) {
          await updateCustomer({
            first_name: signup.first_name,
            last_name: signup.last_name,
          });
        }

        const stored = sessionStorage.getItem("post_login_redirect");
        sessionStorage.removeItem("post_login_redirect");
        const target =
          stored && stored.startsWith("/") && !stored.startsWith("//") ? stored : RETURN_FALLBACK;
        // Hard navigation, NOT navigate(): CustomerProvider resolves the session
        // once per page load, behind a `started` latch. This page was loaded by
        // Shopify's redirect BEFORE completeAuth ran, so that one resolution saw
        // no stored session and cached `customer: null`. An in-app navigate()
        // keeps that stale snapshot, so the destination still believes nobody is
        // signed in — on /wholesale-copy that means `!customer` and the visitor
        // is dropped back onto "Have you ordered from Native before?", i.e. the
        // flow restarts right after a SUCCESSFUL login. Reloading re-runs the
        // provider with the session now in localStorage. Every other post-login
        // hand-off here already reloads for this reason (WholesaleCopy,
        // WholesalePending, WholesaleRejected); this path was the exception.
        window.location.replace(target);
      } else {
        const code = res.data?.error ?? "callback_failed";
        navigate(withError(safeReturnTo(), code), { replace: true });
      }
    })();

  }, [params, navigate]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div
        className="flex flex-col items-center gap-3 text-center"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 text-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Completing your login...</p>
      </div>
    </main>
  );
}
