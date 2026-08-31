import { Link } from "react-router-dom";
import LoginBackground from "./LoginBackground";
import TMark from "./TMark";

interface Props {
  onBack: () => void;
}

const NoAccountStep = ({ onBack }: Props) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-wholesale-bg">
      <LoginBackground />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-md space-y-5 text-center">
          <h2 className="text-[#F8F5E4] text-2xl font-medium drop-shadow">
            Let's set up your wholesale login.
          </h2>
          <p className="text-[#F8F5E4]/90 text-sm drop-shadow">
            Since you already have access, we just need a few details to create your account.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={onBack}
              className="h-7 px-6 rounded-full border border-black text-sm font-medium transition-colors bg-[#F8F5E4] text-black hover:bg-[#f0f0e4]"
            >
              Back
            </button>
            <Link
              to="/wholesale-request?mode=setup"
              className="h-7 px-6 inline-flex items-center rounded-full border border-black text-sm font-medium transition-colors bg-[#c9c2b2] text-black hover:bg-[#b8b0a0]"
            >
              Set up my login
            </Link>
          </div>
        </div>

        <TMark />
      </div>
    </div>
  );
};

export default NoAccountStep;
