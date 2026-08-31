import { useState } from "react";
import WholesaleProductTable from "./WholesaleProductTable";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { Separator } from "@/components/ui/separator";

interface WholesaleProductSectionProps {
  countryCode?: string;
  isLoadingLocation?: boolean;
}

const WholesaleProductSection = ({ countryCode, isLoadingLocation }: WholesaleProductSectionProps) => {
  const { data: productsByCategory, isLoading, error } = useShopifyProducts();

  if (isLoading || isLoadingLocation) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wholesale-primary mx-auto"></div>
          <p className="mt-4 text-wholesale-secondary">Loading coffee products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <p className="text-red-600">Error loading products: {error.message}</p>
          <p className="text-wholesale-secondary mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-10 pb-0 space-y-6">
      {productsByCategory?.['BOX SETS'] && productsByCategory['BOX SETS'].length > 0 && (
        <WholesaleProductTable
          title="BOX SETS"
          subtitle=""
          products={productsByCategory['BOX SETS']}
          countryCode={countryCode}
          boxSetLayout={true}
        />
      )}

      {productsByCategory?.BASE && productsByCategory.BASE.length > 0 && (
        <WholesaleProductTable
          title="BASE"
          subtitle=""
          products={productsByCategory.BASE}
          countryCode={countryCode}
        />
      )}
      
      {productsByCategory?.ESSENTIALS && productsByCategory.ESSENTIALS.length > 0 && (
        <WholesaleProductTable
          title="ESSENTIALS"
          subtitle="COLLECTION"
          products={productsByCategory.ESSENTIALS}
          countryCode={countryCode}
          backgroundColor="#ECE7D0"
          titleSize="25px"
          subtitleSize="14px"
          description={[
            "THESE BLENDS USE THE FAMED CASTILLO DOUBLE ANAEROBIC THERMAL SHOCK PROFILES FROM FINCA EL PARAISO (WHICH ARE VERY NATURALLY SWEET AND APPROACHABLE) AND A SWEET AND SOFT WASHED CASTILLO FROM DIEGO BERMUDEZ",
            "MADE FOR ANY CUSTOMER YET FUN FOR THOSE OF US WHO AREN'T WANTING JUST A BASIC / TRADITIONAL BLEND",
            "CREATED TO PERFORM WELL ON FILTER / BLACK AND ESPRESSO / WITH MILK",
            "THESE COFFEES WILL CHALLENGE YOUR PERCEPTION ABOUT BLENDS. BLENDS SHOULDN'T BE A WAY TO SETTLE, BUT TO CREATE SOMETHING THAT'S BETTER THAN THE SUM OF IT'S PARTS. THESE COFFEES ARE PRACTICAL BUT JUST A LITTLE BIT MAGICAL TOO - AND THAT'S WHAT WE LOVE ABOUT THEM."
          ]}
        />
      )}
      
      {productsByCategory?.['TOP SHELF'] && productsByCategory['TOP SHELF'].length > 0 && (
        <>
          <div className="w-full">
            <Separator className="bg-black h-[1px]" />
          </div>
          <WholesaleProductTable
            title="TOP SHELF"
            subtitle=""
            products={productsByCategory['TOP SHELF']}
            countryCode={countryCode}
          />
        </>
      )}

      {productsByCategory?.COMPETITION && productsByCategory.COMPETITION.length > 0 && (
        <WholesaleProductTable
          title="COMPETITION"
          subtitle=""
          products={productsByCategory.COMPETITION}
          countryCode={countryCode}
        />
      )}

      {productsByCategory?.EXOTIC && productsByCategory.EXOTIC.length > 0 && (
        <>
          <div className="w-full">
            <Separator className="bg-black h-[1px]" />
          </div>
          <WholesaleProductTable
            title="EXOTIC"
            subtitle=""
            products={productsByCategory.EXOTIC}
            countryCode={countryCode}
          />
        </>
      )}

      {productsByCategory?.['HYPER LIMITED'] && productsByCategory['HYPER LIMITED'].length > 0 && (
        <>
          <div className="w-full">
            <Separator className="bg-black h-[1px]" />
          </div>
          <WholesaleProductTable
            title="HYPER LIMITED"
            subtitle=""
            products={productsByCategory['HYPER LIMITED']}
            countryCode={countryCode}
          />
        </>
      )}
    </div>
  );
};

export default WholesaleProductSection;