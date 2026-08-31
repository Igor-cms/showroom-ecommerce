import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import LoginBackground from "@/components/wholesale-copy/LoginBackground";
import TMark from "@/components/wholesale-copy/TMark";
import { startAuth, beginAuthRedirect, stashRetailSignup } from "@/lib/customerAuth";
import { useLoginBootGate } from "@/hooks/useLoginBootGate";

/* =========================================================================
 *  /signup — retail account creation.
 *
 *  The retail counterpart to the wholesale application: a PERSON signs up,
 *  not a business, so it asks for a name and an email and nothing else. No
 *  shop name, no tax numbers, no admin review — a retail customer is approved
 *  by definition and can shop the moment the login is confirmed.
 *
 *  Identity still lives in Shopify, exactly as it does for wholesale: we hand
 *  the email to the Shopify login (which creates the account when it is new),
 *  and write the name onto that customer once the session proves who they are.
 *  Nothing here tags the customer, so they stay retail until an admin approves
 *  a wholesale application.
 *
 *  Same composition as /login (photo background + cream pills) so the pair
 *  reads as one flow.
 * ========================================================================= */

export default function CustomerSignup() {
  // Nothing to resolve before rendering here, so the boot screen only waits on
  // the shared login assets.
  useLoginBootGate(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    firstName.trim() !== "" && lastName.trim() !== "" && email.trim() !== "";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setError(null);
    setLoading(true);

    // Park the details across the Shopify redirect — /auth/callback applies
    // them once the session identifies the customer.
    stashRetailSignup({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
    });
    try {
      sessionStorage.setItem("post_login_redirect", "/account");
    } catch {
      // ignore storage errors — the callback falls back to /account anyway
    }

    const res = await startAuth(email.trim().toLowerCase());
    if (res.ok && beginAuthRedirect(res.data)) {
      return;
    }
    setError("Unable to start sign up. Please try again.");
    setLoading(false);
  }

  const pill =
    "w-full h-9 rounded-full bg-[#FCFCF4]/90 backdrop-blur-sm px-6 text-left text-base text-neutral-800 placeholder:text-neutral-500 border-none outline-none";

  return (
    <main className="relative w-full h-screen overflow-hidden bg-wholesale-bg">
      <LoginBackground />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-3" noValidate>
          <p className="text-[#FCFCF4] text-center text-sm drop-shadow">
            Create your Native account.
          </p>

          <input
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setError(null);
            }}
            placeholder="First name"
            disabled={loading}
            className={pill}
          />
          <input
            type="text"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setError(null);
            }}
            placeholder="Last name"
            disabled={loading}
            className={pill}
          />

          <div className="relative flex items-center h-9 rounded-full bg-[#FCFCF4]/90 backdrop-blur-sm">
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="Enter your email"
              disabled={loading}
              className="flex-1 h-full bg-transparent border-none outline-none pl-6 pr-32 text-left text-base text-neutral-800 placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={loading || !ready}
              className={`absolute right-1 h-7 px-6 rounded-full border border-black text-sm font-medium transition-colors ${
                ready && !loading
                  ? "bg-[#c9c2b2] text-black hover:bg-[#b8b0a0] cursor-pointer"
                  : "bg-[#c9c2b2] text-black cursor-not-allowed"
              }`}
            >
              {loading ? "Redirecting..." : "SIGN UP"}
            </button>
          </div>

          {error && (
            <p
              className="text-red-500 text-center text-sm drop-shadow"
              aria-live="polite"
            >
              {error}
            </p>
          )}

          <div className="text-center">
            <Link
              to="/login"
              className="text-[#FCFCF4] text-sm font-medium hover:underline drop-shadow uppercase"
            >
              I already have an account
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
