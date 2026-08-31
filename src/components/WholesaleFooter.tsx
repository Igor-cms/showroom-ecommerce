import naliveLogo from "@/assets/nalive-logo-new.png";
import bottleIcon from "@/assets/bottle-icon.webp";

const WholesaleFooter = () => {
  return (
    <footer className="border-t border-ink/40 bg-[#e6e1c4] mt-0">
      <div className="mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-10 pt-2 pb-0">
        {/* Navigation Links - Top */}
        <nav className="flex justify-start items-center space-x-8 mb-8">
          <a
            href="https://thenativecoffeecompany.com/"
            className="text-[10px] md:text-sm font-bold text-wholesale-primary hover:underline"
            style={{ letterSpacing: "-0.4px" }}
          >
            HOME
          </a>
          <a
            href="https://thenativecoffeecompany.com/"
            className="text-[10px] md:text-sm font-bold text-wholesale-primary hover:underline"
            style={{ letterSpacing: "-0.4px" }}
          >
            SHOP
          </a>
          <a
            href="https://thenativecoffeecompany.com/about/"
            className="text-[10px] md:text-sm font-bold text-wholesale-primary hover:underline"
            style={{ letterSpacing: "-0.4px" }}
          >
            ABOUT
          </a>
          <a
            href="https://wholesale.thenativecoffeecompany.com/wholesale"
            className="text-[10px] md:text-sm font-bold text-wholesale-primary hover:underline"
            style={{ letterSpacing: "-0.4px" }}
          >
            WHOLESALE
          </a>
          <a
            href="https://thenativecoffeecompany.com/contact/"
            className="text-[10px] md:text-sm font-bold text-wholesale-primary hover:underline"
            style={{ letterSpacing: "-0.4px" }}
          >
            CONTACT
          </a>
        </nav>

        {/* Large NALIVE text with bottle aligned to bottom */}
        <div className="flex items-end mb-6 gap-4 md:gap-8">
          <img src={naliveLogo} alt="Nalive" className="w-[90%] object-contain ml-[-0.5vw]" />
          <img src={bottleIcon} alt="Bottle" className="w-[5%] object-contain" />
        </div>

        {/* Bottom Info - Three Columns */}
        <div className="flex gap-8 text-wholesale-primary items-end">
          <div className="text-left flex items-end gap-4 w-[55%]">
            <div className="flex flex-col">
              <div className="font-bold text-2xl" style={{ letterSpacing: "-0.3px", lineHeight: "19px" }}>
                LUXURY
              </div>
              <div className="font-bold text-2xl" style={{ letterSpacing: "-0.3px", lineHeight: "19px" }}>
                COFFEE
              </div>
            </div>
            <div className="text-[8px] md:text-xs font-bold leading-tight">
              CURATING THE BEST COFFEE
              <br />
              FROM PRODUCERS GLOBALLY
            </div>
          </div>
          <div className="text-left flex flex-col justify-end ml-auto md:ml-0">
            <div className="font-bold text-[8px] md:text-xs">CHALLENGE</div>
            <div className="text-[8px] md:text-xs font-bold">THE ORDINARY</div>
          </div>
          <div className="text-left hidden md:flex flex-col justify-end ml-auto">
            <div className="font-bold text-xs">DALLAS, TX</div>
            <div className="text-xs font-bold">32.7767° N, 96.7970°</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WholesaleFooter;
