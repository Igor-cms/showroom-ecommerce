import { Link } from "react-router-dom";
import { useCustomer } from "@/contexts/CustomerContext";

/**
 * Header sign-in indicator.
 *
 * Until now the site gave a signed-in customer no visible confirmation: the
 * headers looked identical whether or not a Shopify session existed. This is
 * the single, shared marker — it renders nothing for anonymous visitors, so
 * the anonymous layout is untouched.
 */
const AccountBadge = ({ className = "" }: { className?: string }) => {
  const { isLoggedIn, displayName, email } = useCustomer();

  if (!isLoggedIn) return null;

  const label = displayName ?? email ?? "Account";
  const initial = label.trim().charAt(0).toUpperCase() || "•";

  return (
    <Link
      to="/account"
      title={email ? `Signed in as ${email}` : "Signed in"}
      aria-label={email ? `Account — signed in as ${email}` : "Account"}
      className={`flex items-center gap-1.5 hover:opacity-60 transition-opacity ${className}`}
      style={{
        fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
        letterSpacing: "0.06em",
      }}
    >
      <span
        aria-hidden
        className="flex items-center justify-center rounded-full border border-ink/50 text-ink"
        style={{ width: 20, height: 20, fontSize: 9, fontWeight: 700, lineHeight: 1 }}
      >
        {initial}
      </span>
      {/* The name is supporting detail — the ring alone carries the state on
          narrow headers where horizontal room is scarce. */}
      <span
        className="hidden lg:inline max-w-[140px] truncate text-ink uppercase"
        style={{ fontSize: 9 }}
      >
        {label}
      </span>
    </Link>
  );
};

export default AccountBadge;
