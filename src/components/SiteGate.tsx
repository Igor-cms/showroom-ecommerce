import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Password gate for the parts of the site that are not open to customers yet.
 *
 * The retail redesign lives on the same build as the wholesale portal, which IS
 * live: wholesale.thenativecoffeecompany.com serves both, so every retail page
 * was reachable by typing its URL while only the wholesale flow was meant to be
 * in use. This holds them closed during the partial launch.
 *
 * It deliberately does NOT change any path. The owner keeps browsing the site
 * exactly as before — /shop stays /shop — and simply enters the password once;
 * the gate then renders the real page in place, with no redirect.
 *
 * WHAT THIS DOES AND DOES NOT DO. The password itself is checked by an edge
 * function (HMAC-signed token, seven days), so it is not a client-side string
 * comparison anyone can read. But the app ships as one 923KB bundle containing
 * every page, and this gate decides what RENDERS, not what is DELIVERED —
 * someone determined can still read the unreleased pages out of the bundle.
 * That trade-off was raised and accepted: the goal here is to keep the pages
 * off-limits to customers and to stray URLs, not to make them unobtainable.
 *
 * It shares `wholesale-admin-token` with the admin screens, so unlocking one
 * unlocks the others. That means the preview password IS the admin password:
 * anyone given it to look at the new site also reaches /wholesale-admin. Fine
 * while it stays with the owner; worth splitting before it is handed around.
 */

// Same key and same function the admin screens already use, so a single sign-in
// covers all of them rather than asking three times for one password.
const TOKEN_KEY = "wholesale-admin-token";

interface SiteGateProps {
  children: ReactNode;
  /** Shown above the field, so it is clear WHY the page is closed. */
  title?: string;
}

const SiteGate = ({ children, title = "Not open yet" }: SiteGateProps) => {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Re-check the stored token on every mount: it expires after seven days, and
  // trusting its mere presence would leave the page open long after it lapsed.
  useEffect(() => {
    let cancelled = false;
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("verify-admin-password", {
          body: { token: stored },
        });
        if (cancelled) return;
        if (data?.valid) setUnlocked(true);
        else localStorage.removeItem(TOKEN_KEY);
      } catch {
        /* A network failure is not proof of anything, so it does not unlock the
           page — it just leaves the password prompt up. */
        if (!cancelled) localStorage.removeItem(TOKEN_KEY);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-admin-password", {
        body: { password },
      });
      if (fnError || data?.error || !data?.token) {
        setError(true);
        setPassword("");
      } else {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUnlocked(true);
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  /* Blank rather than the page while the token is verified. Rendering the
     children first and hiding them on failure would defeat the point. */
  if (checking) {
    return <div className="min-h-screen bg-wholesale-bg" />;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-wholesale-bg flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-xl font-semibold text-wholesale-primary">{title}</h1>
        <p className="text-center text-sm text-wholesale-secondary">
          This part of the site is still being built. Enter the password to preview it.
        </p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          className={`w-full h-10 px-4 rounded border bg-background outline-none ${
            error ? "border-red-500" : "border-input"
          }`}
          autoFocus
        />
        {error && <p className="text-center text-sm text-red-500">Incorrect password</p>}
        <button
          type="submit"
          disabled={!password || submitting}
          className="w-full h-10 rounded bg-foreground text-background font-medium disabled:opacity-60"
        >
          {submitting ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
};

export default SiteGate;
