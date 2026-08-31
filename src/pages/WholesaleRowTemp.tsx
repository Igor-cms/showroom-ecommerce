import { useEffect } from "react";
import WholesaleHeader from "../components/WholesaleHeader";
import WholesaleHero from "../components/WholesaleHero";
import WholesaleInfoCards from "../components/WholesaleInfoCards";
import WholesaleFooter from "../components/WholesaleFooter";
import WholesaleRowTable from "../components/WholesaleRowTable";
import { getProductsByCollection } from "@/data/wholesaleRowProducts";
import { useLocationDetection } from "@/hooks/useLocationDetection";
import { Separator } from "@/components/ui/separator";

const WholesaleRowTemp = () => {
  const productsByCollection = getProductsByCollection();
  const { location, isLoading, countryCode } = useLocationDetection();

  useEffect(() => {
    if (location) {
      console.log('WholesaleRowTemp - User location detected:', {
        country: location.country,
        countryCode: location.countryCode,
      });
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-wholesale-bg" style={{ paddingTop: "var(--site-header-h, 72px)" }}>
      <WholesaleHeader compact fixed solid />
      <WholesaleHero />
      <WholesaleInfoCards />
      
      <div className="w-full py-12 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-wholesale-secondary">Loading location...</p>
          </div>
        ) : (
          <>
            {productsByCollection['BASE'].length > 0 && (
              <WholesaleRowTable
                title="BASE"
                products={productsByCollection['BASE']}
                countryCode={countryCode}
              />
            )}
            
            {productsByCollection['ESSENTIALS'].length > 0 && (
              <WholesaleRowTable
                title="ESSENTIALS"
                subtitle="COLLECTION"
                products={productsByCollection['ESSENTIALS']}
                countryCode={countryCode}
              />
            )}
            
            {productsByCollection['TOP SHELF'].length > 0 && (
              <>
                <div className="w-screen relative left-[50%] right-[50%] -mx-[50vw]">
                  <Separator className="bg-black h-[2px]" />
                </div>
                <WholesaleRowTable
                  title="TOP SHELF"
                  products={productsByCollection['TOP SHELF']}
                  countryCode={countryCode}
                />
              </>
            )}

            {productsByCollection['EXOTIC'].length > 0 && (
              <>
                <div className="w-screen relative left-[50%] right-[50%] -mx-[50vw]">
                  <Separator className="bg-black h-[2px]" />
                </div>
                <WholesaleRowTable
                  title="EXOTIC"
                  products={productsByCollection['EXOTIC']}
                  countryCode={countryCode}
                />
              </>
            )}

            {productsByCollection['HYPER LIMITED'].length > 0 && (
              <>
                <div className="w-screen relative left-[50%] right-[50%] -mx-[50vw]">
                  <Separator className="bg-black h-[2px]" />
                </div>
                <WholesaleRowTable
                  title="HYPER LIMITED"
                  products={productsByCollection['HYPER LIMITED']}
                  countryCode={countryCode}
                />
              </>
            )}
          </>
        )}
      </div>

      <WholesaleFooter />
    </div>
  );
};

export default WholesaleRowTemp;
