import WholesaleHeader from "../components/WholesaleHeader";
import WholesaleHero from "../components/WholesaleHero";
import WholesaleInfoCards from "../components/WholesaleInfoCards";
import WholesaleOrderHistory from "../components/WholesaleOrderHistory";
import WholesaleProductSection from "../components/WholesaleProductSection";
import WholesaleFooter from "../components/WholesaleFooter";
import { WholesaleCart } from "../components/WholesaleCart";

const WholesaleRow = () => {
  // Always show Colombia variants on /wholesale-row page
  const countryCode = "CO";
  const isLoading = false;

  return (
    <div className="min-h-screen bg-wholesale-bg" style={{ paddingTop: "var(--site-header-h, 72px)" }}>
      {/* Same header contract as /wholesale: the portal is a destination of its
          own, so the logo goes to the CURRENT site and the hamburger stays
          inert. Left on its defaults, it linked to "/" and opened the menu —
          both routes into the new site, from inside the portal. */}
      <WholesaleHeader compact fixed solid logoHref="https://thenativecoffeecompany.com/" disableMenu />
      <WholesaleHero />
      <WholesaleInfoCards />
      {/* Past orders sit above the offer list: reordering is the fastest path
          to a repeat purchase, and it renders nothing when there is no history. */}
      <WholesaleOrderHistory countryCode={countryCode} />
      <WholesaleProductSection countryCode={countryCode} isLoadingLocation={isLoading} />
      <WholesaleFooter />
      <WholesaleCart />
    </div>
  );
};

export default WholesaleRow;
