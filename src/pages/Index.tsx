import { useRef } from "react";
import Header from "../components/Header";
import HeroFeaturedProduct from "../components/HeroFeaturedProduct";
import FooterLockup from "../components/FooterLockup";
import FloatingCartToggle from "../components/FloatingCartToggle";
import CartDrawer from "../components/CartDrawer";
import NewDropsSection from "../components/NewDropsSection";
import { useShopifyStorefrontProducts } from "../hooks/useShopifyStorefrontProducts";

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { data: products, isLoading, isError } = useShopifyStorefrontProducts();

  return (
    <div className="min-h-screen bg-background pt-[var(--site-header-h,127px)] md:pt-0">
      {/* On mobile the header is a solid bar (not the full-bleed floating logo),
          so the pt reserves its real height (--site-header-h, published by the
          header) and the hero starts below it; desktop keeps the hero full-bleed
          behind the floating header (md:pt-0). */}
      <Header />
      <FloatingCartToggle />
      <CartDrawer />

      <div ref={heroRef} className="relative overflow-hidden">
        <HeroFeaturedProduct />

        {/* CHALLENGE THE ORDINARY — spread editorially across the top-right of
            the hero media (not a vertical block): ORDINARY left, CHALLENGE
            center/upper, THE right. Clipped to hero, fixed through first fold. */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute hidden sm:block"
          style={{
            // Fixed offsets: the block keeps the SAME distance from the top and
            // the right edge at every window size. Anchoring the top to the live
            // header height (--site-header-h) keeps it 12px under the cream bar —
            // the text is cream, so it would vanish if it rose into it. These were
            // vh/vw clamps before, which made the block drift and resize as the
            // window changed.
            top: "calc(var(--site-header-h, 142px) + 4px)",
            right: "48px",
            width: "300px",
            height: "80px",
            zIndex: 5,
          }}
        >
          {[
            // 13px steps (was 18px) — tighter leading between the three words.
            { word: "CHALLENGE", right: "44px", top: "0" },
            { word: "THE", right: "-24px", top: "13px" },
            { word: "ORDINARY", right: "152px", top: "26px" },
          ].map(({ word, ...pos }) => (
            <span
              key={word}
              className="font-body"
              style={{
                position: "absolute",
                ...pos,
                whiteSpace: "nowrap",
                fontSize: "11px",
                fontWeight: 300,
                lineHeight: 1.1,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "rgba(250, 247, 235, 0.95)",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <main>
        {isLoading && (
          <div className="px-6 py-24 text-center text-sm uppercase tracking-widest text-muted-foreground">
            Loading products…
          </div>
        )}
        {isError && (
          <div className="px-6 py-24 text-center text-sm uppercase tracking-widest text-muted-foreground">
            Could not load products from Shopify.
          </div>
        )}
        {!isLoading && !isError && products && products.length > 0 && (
          <NewDropsSection products={products} />
        )}
      </main>

      <FooterLockup />
    </div>
  );
};

export default Index;
