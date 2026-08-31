import { logout } from "@/lib/customerAuth";
import LoginBackground from "./LoginBackground";
import TMark from "./TMark";

// Shown when a wholesale customer is tagged `wholesale-rejected`.
const WholesaleRejected = () => {
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
      {/* Same shared background as every other wholesale login-flow screen, so
          the photo behaves identically (sizing, crop, labels) on all of them. */}
      <LoginBackground />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-md space-y-5 text-center">
          <h2 className="text-[#F8F5E4] text-2xl font-medium drop-shadow">
            We couldn't approve your wholesale account
          </h2>
          <p className="text-[#F8F5E4]/90 text-sm drop-shadow">
            Unfortunately your wholesale request wasn't approved at this time. If
            you think this is a mistake, please reach out to our team.
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

export default WholesaleRejected;
