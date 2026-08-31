import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { getCustomerType, logout } from "@/lib/customerAuth";
import RetailOrderHistory from "@/components/RetailOrderHistory";
import CartDrawer from "@/components/CartDrawer";
import FloatingCartToggle from "@/components/FloatingCartToggle";

export default function CustomerAccount() {
  const { customer, loading, unauthenticated } = useCustomerSession();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  /* React Router stamps the session's very first entry with key "default", so
     this tells us whether there is any in-app history to go back to. */
  const isFirstPage = useLocation().key === "default";

  useEffect(() => {
    if (unauthenticated) {
      const here = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(here)}`, { replace: true });
    }
  }, [unauthenticated, navigate]);


  async function onLogout() {
    setSigningOut(true);
    await logout();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
      </main>
    );
  }

  if (!customer) return null;

  const accountType = getCustomerType(customer);

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <FloatingCartToggle />
      <CartDrawer />
      <div className="max-w-2xl mx-auto space-y-10">
        {/* The account page carries no site header, so without this the only
            way out was the browser's own back button. Goes back one step when
            the visitor arrived from somewhere in the site; when /account IS the
            first page of the session (opened from a link, or landed on straight
            after logging in) there is nothing to go back TO, so it falls back
            to wherever that customer's shopping actually happens.

            For a wholesale customer that is the portal, not the homepage — the
            two are separate storefronts, and sending them "back" to a shop they
            cannot buy from is wrong on its own terms. It also happens to matter
            right now: "/" is closed during the partial launch, so the fallback
            was landing wholesale customers on the password wall. */}
        <button
          type="button"
          onClick={() =>
            isFirstPage
              ? navigate(accountType === "wholesale" ? "/wholesale-copy" : "/")
              : navigate(-1)
          }
          className="group -mb-4 inline-flex items-center gap-1.5 uppercase text-foreground/45 hover:text-foreground/70 transition-colors"
          style={{
            fontFamily: "'Helvetica', Arial, sans-serif",
            fontWeight: 400,
            fontSize: "11px",
            letterSpacing: "0.02em",
          }}
        >
          <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">
            &larr;
          </span>
          Back
        </button>

        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {customer.displayName || "My account"}
            </h1>
            {customer.emailAddress?.emailAddress && (
              <p className="text-sm text-muted-foreground mt-1">
                {customer.emailAddress.emailAddress}
              </p>
            )}
            {/* Which kind of customer this is. There used to be a "Go to
                wholesale portal" link under it, dropped as a duplicate: now
                that BACK falls back to the portal for wholesale customers, both
                controls land in the same place on every route into this page —
                arriving from the portal, and arriving directly. */}
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mt-3">
              {accountType === "wholesale" ? "Wholesale account" : "Retail account"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onLogout}
            disabled={signingOut}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </Button>
        </header>

        <RetailOrderHistory />
      </div>
    </main>
  );
}
