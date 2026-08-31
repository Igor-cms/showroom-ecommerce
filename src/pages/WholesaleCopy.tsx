import { useEffect, useState } from "react";
import WholesaleHeader from "../components/WholesaleHeader";
import WholesaleHero from "../components/WholesaleHero";
import WholesaleInfoCards from "../components/WholesaleInfoCards";
import WholesaleProductSection from "../components/WholesaleProductSection";
import WholesaleFooter from "../components/WholesaleFooter";
import { WholesaleCart } from "../components/WholesaleCart";
import TheVaultSection from "../components/TheVaultSection";
import PasswordProtection from "@/components/PasswordProtectionCopy";
import LoginBackground from "@/components/wholesale-copy/LoginBackground";
import LoginFlow from "@/components/wholesale-copy/LoginFlow";
import WholesalePending from "@/components/wholesale-copy/WholesalePending";
import WholesaleRejected from "@/components/wholesale-copy/WholesaleRejected";
import WholesaleLoadingScreen from "@/components/wholesale-copy/WholesaleLoadingScreen";
import wholesaleHeroBg from "../assets/wholesale-hero-new.webp";
import { Navigate } from "react-router-dom";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { useLoginBootGate } from "@/hooks/useLoginBootGate";
import { supabase } from "@/integrations/supabase/client";
import { logout, registerWholesale } from "@/lib/customerAuth";
import { canEnterWholesalePortal } from "@/lib/wholesaleAccess";

const WholesaleCopy = () => {
  // eslint-disable-next-line no-console
  console.warn("[wholesale-copy] mount", {
    href: typeof window !== "undefined" ? window.location.href : null,
    hasSetupPayload:
      typeof window !== "undefined" &&
      !!sessionStorage.getItem("wholesale_setup_payload"),
    hasResetParam:
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("reset"),
  });
  const [passwordOk, setPasswordOk] = useState(false);
  const [passwordChecking, setPasswordChecking] = useState(true);
  const [resetting, setResetting] = useState(
    typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("reset"),
  );
  // Tracks whether the hero background image has finished loading so we can
  // show a loading screen (cream dots) until the portal is ready to render.
  const [heroLoaded, setHeroLoaded] = useState(false);

  // After a Shopify login that was started to CONFIRM ownership of an existing
  // email (from the wholesale setup form), the reviewed details were stashed
  // before the redirect. Apply them now that the session proves ownership.
  const [applyingSetup, setApplyingSetup] = useState(
    typeof window !== "undefined" &&
      !!sessionStorage.getItem("wholesale_setup_payload"),
  );

  useEffect(() => {
    if (!applyingSetup) return;
    (async () => {
      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(
          sessionStorage.getItem("wholesale_setup_payload") ?? "null",
        );
      } catch {
        payload = null;
      }
      // Clear first so a reload can never re-trigger the write.
      try {
        sessionStorage.removeItem("wholesale_setup_payload");
      } catch {
        // ignore
      }
      if (payload) {
        try {
          // Now session-authenticated: the server verifies the session resolves
          // to this same customer before applying the changes + pending tag.
          await registerWholesale(payload);
        } catch {
          // ignore — worst case the applicant re-submits
        }
      }
      // Reload so the gate re-reads the freshly-tagged Shopify customer.
      window.location.replace("/wholesale-copy");
    })();
  }, [applyingSetup]);

  useEffect(() => {
    const img = new Image();
    const done = () => setHeroLoaded(true);
    img.onload = done;
    img.onerror = done; // don't trap the user behind a broken image
    img.src = wholesaleHeroBg;
    if (img.complete) done(); // already cached
  }, []);

  useEffect(() => {
    if (!resetting) return;
    (async () => {
      try {
        localStorage.removeItem("wholesale-copy-token");
        Object.keys(localStorage)
          .filter((k) => k.startsWith("wholesale_profile_completed"))
          .forEach((k) => localStorage.removeItem(k));
        sessionStorage.removeItem("wholesale_lookup_email");
        sessionStorage.removeItem("post_login_redirect");
        sessionStorage.removeItem("wholesale_profile_completed_email");
        await logout();
      } catch {
        // ignore
      }
      window.location.replace("/wholesale-copy");
    })();
  }, [resetting]);

  const { customer, loading: customerLoading, refresh } = useCustomerSession();

  // While the applicant waits on the "under review" screen, poll the live
  // Shopify customer so the page flips to the wholesale portal the moment an
  // admin approves them — no manual refresh required.
  const wholesaleStatus = customer?.wholesaleStatus ?? null;
  useEffect(() => {
    if (wholesaleStatus !== "pending") return;
    const id = setInterval(() => {
      refresh();
    }, 10000);
    return () => clearInterval(id);
  }, [wholesaleStatus, refresh]);

  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem("wholesale-copy-token");
      if (!token) {
        setPasswordChecking(false);
        return;
      }
      try {
        const { data } = await supabase.functions.invoke(
          "verify-wholesale-password",
          { body: { token } },
        );
        if (data?.valid) setPasswordOk(true);
        else localStorage.removeItem("wholesale-copy-token");
      } catch {
        localStorage.removeItem("wholesale-copy-token");
      } finally {
        setPasswordChecking(false);
      }
    };
    validate();
  }, []);

  // eslint-disable-next-line no-console
  console.warn("[wholesale-copy] gate state", {
    passwordOk,
    hasCustomer: !!customer,
    wholesaleStatus: customer?.wholesaleStatus ?? null,
  });

  /* Resolving this gate needs two network round-trips
     (verify-wholesale-password and customer-account-get); measured on a
     returning visitor they finished at ~2.4s. Which step renders afterwards is
     genuinely unknown until then, so the boot screen stays up for the whole
     wait — passing `false` below keeps it there — and the page is revealed once,
     complete, instead of assembling itself in front of the visitor.

     The background still renders underneath while that happens, so when the
     loader does lift there is a finished page behind it rather than an empty
     frame waiting on its own photo. */
  const gateResolved = !(resetting || applyingSetup || passwordChecking || customerLoading);
  useLoginBootGate(gateResolved);

  if (!gateResolved) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-wholesale-bg">
        <LoginBackground />
      </div>
    );
  }

  // The portal is gated by TWO independent states, both required to enter:
  //   A) Wholesale access approved — a valid wholesale password (`passwordOk`)
  //      OR the Shopify `wholesale-approved` tag.
  //   B) Shopify login confirmed — an active customer session (`customer`).
  // A Shopify session ALONE only proves an account exists; it must NOT, by
  // itself, unlock wholesale purchasing. So an authenticated customer without
  // wholesale access (status null/untagged) is sent to the password gate, not
  // straight into the store.
  const passwordGate = (
    <PasswordProtection
      onAuthenticate={(token) => {
        localStorage.setItem("wholesale-copy-token", token);
        setPasswordOk(true);
      }}
    />
  );

  // No Shopify session (state B missing): require the wholesale password first,
  // then send them through the Shopify login flow.
  if (!customer) {
    if (!passwordOk) return passwordGate;
    return <LoginFlow />;
  }

  // Shopify session present (state B satisfied). A rejected customer is an
  // explicit admin decision and is always blocked.
  if (customer.wholesaleStatus === "rejected") {
    return <WholesaleRejected />;
  }

  // State A: approved tag or a valid wholesale password.
  const wholesaleApproved =
    passwordOk || customer.wholesaleStatus === "approved";

  if (!wholesaleApproved) {
    // Awaiting admin review.
    if (customer.wholesaleStatus === "pending") {
      return <WholesalePending />;
    }
    // Logged in but no wholesale access (status null/untagged): the Shopify
    // session alone does not grant entry — require the wholesale password.
    return passwordGate;
  }

  // Both states satisfied. Completeness is derived from the live Shopify
  // customer (not a localStorage flag): if a required field is missing, send
  // them to the update form first; otherwise they go straight to /wholesale-row.
  //
  // The final hand-off below is guarded on the other side by
  // ProtectedWholesaleRow, which admits exactly `canEnterWholesalePortal`. The
  // assertion here is that reaching this point implies that predicate is true —
  // if the two ever drifted apart, the visitor would bounce between the pages,
  // so this branch is written in terms of the same shared function.
  if (!canEnterWholesalePortal({ customer, passwordOk })) {
    // Diagnostic: log which required fields are still empty so we can trace
    // why a freshly-registered customer looks "incomplete" on the next visit.
    const nameParts = (customer.displayName ?? "").split(" ").filter(Boolean);
    const missing = {
      firstName: !(customer.firstName ?? nameParts[0] ?? "").trim(),
      lastName: !(customer.lastName ?? nameParts.slice(1).join(" ") ?? "").trim(),
      shopName: !(customer.defaultAddress?.company ?? "").trim(),
      country: !(customer.defaultAddress?.country ?? "").trim(),
      defaultAddressPresent: !!customer.defaultAddress,
    };
    // eslint-disable-next-line no-console
    console.warn("[wholesale-copy] profile incomplete →", missing, {
      customer,
    });
    return <Navigate to="/wholesale-request?mode=update" replace />;
  }
  return <Navigate to="/wholesale-row" replace />;

  const countryCode = "US";
  return (
    <div className="min-h-screen bg-wholesale-bg" style={{ paddingTop: "var(--site-header-h, 72px)" }}>
      {!heroLoaded && <WholesaleLoadingScreen />}
      {/* Unreachable today (the return above is unconditional), but kept in
          step with the rest of the flow so reviving this block cannot quietly
          reopen a route to the site. */}
      <WholesaleHeader compact fixed solid logoHref={null} disableMenu />
      <WholesaleHero />
      <WholesaleInfoCards />
      <TheVaultSection />
      <WholesaleProductSection countryCode={countryCode} isLoadingLocation={false} />
      <WholesaleFooter />
      <WholesaleCart />
    </div>
  );
};

export default WholesaleCopy;
