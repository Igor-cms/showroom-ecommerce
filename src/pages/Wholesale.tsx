import WholesaleHeader from "../components/WholesaleHeader";
import WholesaleHero from "../components/WholesaleHero";
import WholesaleInfoCards from "../components/WholesaleInfoCards";
import WholesaleProductSection from "../components/WholesaleProductSection";
import WholesaleFooter from "../components/WholesaleFooter";
import { WholesaleCart } from "../components/WholesaleCart";

const Wholesale = () => {
  // Always show United States variants on /wholesale page
  const countryCode = "US";
  const isLoading = false;

  return (
    <div className="min-h-screen bg-wholesale-bg" style={{ paddingTop: "var(--site-header-h, 72px)" }}>
      <WholesaleHeader compact fixed solid logoHref="https://thenativecoffeecompany.com/" disableMenu />
      <WholesaleHero />
      <WholesaleInfoCards />
      <WholesaleProductSection countryCode={countryCode} isLoadingLocation={isLoading} />
      <WholesaleFooter />
      <WholesaleCart />
    </div>
  );
};

export default Wholesale;