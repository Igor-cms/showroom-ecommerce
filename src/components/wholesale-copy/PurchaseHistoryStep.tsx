import LoginBackground from "./LoginBackground";
import TMark from "./TMark";

interface Props {
  onAnswer: (hasPurchased: boolean) => void;
}

const PurchaseHistoryStep = ({ onAnswer }: Props) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-wholesale-bg">
      <LoginBackground />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-[#F8F5E4] text-2xl font-medium drop-shadow">
            Have you ordered from Native before?
          </h2>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => onAnswer(true)}
              className="h-7 px-6 rounded-full border border-black text-sm font-medium transition-colors bg-[#c9c2b2] text-black hover:bg-[#b8b0a0]"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              className="h-7 px-6 rounded-full border border-black text-sm font-medium transition-colors bg-[#F8F5E4] text-black hover:bg-[#f0f0e4]"
            >
              No
            </button>
          </div>
        </div>

        <TMark />
      </div>
    </div>
  );
};

export default PurchaseHistoryStep;
