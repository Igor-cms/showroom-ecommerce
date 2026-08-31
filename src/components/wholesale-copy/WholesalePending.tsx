import { logout } from "@/lib/customerAuth";
import WholesaleHeader from "@/components/WholesaleHeader";
import LoginBackground from "./LoginBackground";
import TMark from "./TMark";

// Shown after a brand-new wholesale registration: the customer is logged in but
// still tagged `wholesale-pending`, so they wait for admin approval instead of
// reaching the portal.
const WholesalePending = () => {
  const signOut = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    window.location.replace("/wholesale-copy");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-wholesale-bg">
      {/* Site-standard header: even without portal access, the applicant can open
          the shared menu (hamburger) and navigate to the rest of the site. */}
      {/* No way out to the site while they wait on approval — see
          WholesaleRequest for why both props are needed. */}
      <WholesaleHeader compact fixed solid logoHref={null} disableMenu />

      {/* Same shared background as every other wholesale login-flow screen, so
          the photo behaves identically (sizing, crop, labels) on all of them. */}
      <LoginBackground />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-md space-y-5 text-center">
          <h2 className="text-[#F8F5E4] text-2xl font-medium drop-shadow">
            Your wholesale request is under review
          </h2>
          <p className="text-[#F8F5E4]/90 text-sm drop-shadow">
            Thanks for signing up. Our team is reviewing your details — you'll get
            access to the wholesale portal once your account is approved.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={signOut}
              className="h-7 px-6 rounded-full border border-black text-sm font-medium transition-colors bg-[#F8F5E4] text-black hover:bg-[#f0f0e4]"
            >
              Sign out
            </button>
          </div>
        </div>

        <TMark />
      </div>
    </div>
  );
};

export default WholesalePending;
