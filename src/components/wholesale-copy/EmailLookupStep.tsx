import { useState } from "react";
import { Link } from "react-router-dom";
import LoginBackground from "./LoginBackground";
import TMark from "./TMark";
import { supabase } from "@/integrations/supabase/client";
import { startAuth, beginAuthRedirect } from "@/lib/customerAuth";

interface Props {
  onBack: () => void;
}

const EmailLookupStep = ({ onBack }: Props) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        "check-shopify-customer",
        { body: { email } },
      );
      if (fnErr || data?.error) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      } else if (data?.exists) {
        const normalized = email.trim().toLowerCase();
        try {
          sessionStorage.setItem("wholesale_lookup_email", normalized);
          // After confirming the Shopify login, return to /wholesale-copy and
          // let the gate decide: complete profile -> portal; missing required
          // fields -> the update form (which prefills from the session).
          sessionStorage.setItem("post_login_redirect", "/wholesale-copy");
        } catch {
          // ignore storage errors
        }
        // Start the Shopify login NOW — no customer info is shown until the
        // user confirms their login. The page leaves on redirect, so we keep
        // the loading state until then.
        const auth = await startAuth(normalized);
        if (auth.ok && beginAuthRedirect(auth.data)) {
          return;
        }
        setError("Couldn't start login. Please try again.");
        setLoading(false);
      } else {
        setNotFound(true);
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-wholesale-bg">
      <LoginBackground />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <form onSubmit={submit} className="w-full max-w-md space-y-3">
          <p className="text-[#F8F5E4] text-center text-sm drop-shadow">
            Please use the same email you used on your previous Native order.
          </p>
          <div className={`relative flex items-center h-9 rounded-full bg-[#F8F5E4]/90 backdrop-blur-sm ${
            error || notFound ? "ring-2 ring-red-500" : ""
          }`}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setNotFound(false);
                setError(null);
              }}
              className="flex-1 min-w-0 h-full bg-transparent border-none outline-none pl-6 pr-28 text-left text-base text-neutral-800 placeholder:text-neutral-500"
              autoComplete="email"
              required
            />
            <button
              type="submit"
              disabled={!email || loading}
              className={`absolute right-1 h-7 px-6 rounded-full border border-black text-sm font-medium transition-colors ${
                email && !loading
                  ? "bg-[#c9c2b2] text-black hover:bg-[#b8b0a0] cursor-pointer"
                  : "bg-[#c9c2b2] text-black cursor-not-allowed"
              }`}
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </div>
          {error && (
            <p className="text-red-300 text-center text-sm drop-shadow">{error}</p>
          )}
          {notFound && (
            <div className="text-center space-y-2">
              <p className="text-[#F8F5E4] text-sm drop-shadow">
                We couldn't find that email. Try another one you may have used,
                or we can set up a new login for you.
              </p>
              <div className="flex gap-3 justify-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("");
                    setNotFound(false);
                  }}
                  className="h-10 px-5 rounded-full bg-white/90 hover:bg-white text-black text-sm font-medium"
                >
                  Try another email
                </button>
                <Link
                  to="/wholesale-request?mode=setup"
                  className="h-10 px-5 inline-flex items-center rounded-full bg-[#007AFF] hover:bg-[#0051D5] text-white text-sm font-medium"
                >
                  Set up my login
                </Link>
              </div>
            </div>
          )}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onBack}
              className="text-[#F8F5E4] text-sm font-medium hover:underline drop-shadow uppercase"
            >
              Back
            </button>
          </div>
        </form>

        <TMark />
      </div>
    </div>
  );
};

export default EmailLookupStep;
