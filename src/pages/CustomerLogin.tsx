import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LoginBackground from "@/components/wholesale-copy/LoginBackground";
import TMark from "@/components/wholesale-copy/TMark";
import { startAuth, beginAuthRedirect } from "@/lib/customerAuth";
import { useLoginBootGate } from "@/hooks/useLoginBootGate";

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: "Invalid login link. Please try again.",
  invalid_state: "Your session has expired. Please sign in again.",
  state_expired: "Your session has expired. Please sign in again.",
  token_exchange_failed: "We couldn't complete the login. Please try again.",
  callback_failed: "We couldn't complete the login. Please try again.",
  access_denied: "Login cancelled.",
  email_mismatch:
    "You signed in with a different account than the email you entered. Please sign in with the correct account.",
};

function messageFor(code: string | null): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? "Login error. Please try again.";
}

export default function CustomerLogin() {
  // Nothing to resolve before rendering here, so the boot screen only waits on
  // the shared login assets.
  useLoginBootGate(true);

  const [params] = useSearchParams();
  const urlError = messageFor(params.get("error"));
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const error = formError ?? urlError;

  function sanitizeRedirect(path: string | null): string | null {
    if (!path) return null;
    if (!path.startsWith("/") || path.startsWith("//")) return null;
    if (
      path.startsWith("/login") ||
      path.startsWith("/signup") ||
      path.startsWith("/auth/callback")
    )
      return null;
    return path;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    let target = sanitizeRedirect(params.get("redirect"));
    if (!target && typeof document !== "undefined" && document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin) {
          target = sanitizeRedirect(ref.pathname + ref.search);
        }
      } catch {
        // ignore
      }
    }
    if (target) {
      sessionStorage.setItem("post_login_redirect", target);
    } else {
      sessionStorage.removeItem("post_login_redirect");
    }

    const res = await startAuth(email);
    if (res.ok && beginAuthRedirect(res.data)) {
      return;
    }
    setFormError("Unable to start login. Please try again.");
    setLoading(false);
  }


  // Same layout as the wholesale login flow (PasswordProtectionCopy): the
  // Samuel/Nathaniel/Luke photo background with a single centered pill.
  return (
    <main className="relative w-full h-screen overflow-hidden bg-wholesale-bg">
      <LoginBackground />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-3" noValidate>
          <div className="relative flex items-center h-9 rounded-full bg-[#FCFCF4]/90 backdrop-blur-sm">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormError(null);
              }}
              placeholder="Enter your email"
              disabled={loading}
              className="flex-1 h-full bg-transparent border-none outline-none pl-6 pr-32 text-left text-base text-neutral-800 placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className={`absolute right-1 h-7 px-6 rounded-full border border-black text-sm font-medium transition-colors ${
                email && !loading
                  ? "bg-[#c9c2b2] text-black hover:bg-[#b8b0a0] cursor-pointer"
                  : "bg-[#c9c2b2] text-black cursor-not-allowed"
              }`}
            >
              {loading ? "Redirecting..." : "LOGIN"}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-center text-sm drop-shadow" aria-live="polite">
              {error}
            </p>
          )}
          <div className="text-center">
            <Link
              to="/signup"
              className="text-[#FCFCF4] text-sm font-medium hover:underline drop-shadow uppercase"
            >
              Create account
            </Link>
          </div>
        </form>

        {/* Shared component rather than a second copy of the same <img>: the
            mark has to recolour itself against the fitted photo's cream band
            below lg, and one of the two copies would inevitably miss that. */}
        <TMark />
      </div>
    </main>
  );
}
