import React, { useEffect, useMemo, useState } from "react";
import WholesaleHeader from "../components/WholesaleHeader";
import NewDropsSection from "../components/NewDropsSection";
import CartDrawer from "../components/CartDrawer";
import FloatingCartToggle from "../components/FloatingCartToggle";
import { Product } from "../data/products";
import { useShopifyStorefrontProducts } from "../hooks/useShopifyStorefrontProducts";

const rmFont = (bold = false): React.CSSProperties => ({
  fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
  fontWeight: bold ? 700 : 400,
});

const ink = "rgba(14,14,14,1)";
const inkHover = "rgba(14,14,14,0.45)";

/* Each category becomes its own NEW-DROPS-style section. `match` selects which
   products belong to it. NEW DROPS is the curated full list. */
type CategoryDef = {
  num: string;
  label: string;
  id: string;
  match: (p: Product) => boolean;
};

const CATEGORIES: CategoryDef[] = [
  { num: "01", label: "NEW DROPS", id: "cat-new-drops", match: () => true },
  { num: "02", label: "BASE", id: "cat-base", match: (p) => p.level === "BASE" },
  { num: "03", label: "TOP SHELF", id: "cat-top-shelf", match: (p) => p.level === "TOP SHELF" },
  { num: "04", label: "COMPETITION", id: "cat-competition", match: (p) => p.level === "COMPETITION" },
  { num: "05", label: "EXOTIC", id: "cat-exotic", match: (p) => p.level === "EXOTICS" },
  { num: "06", label: "HYPER LIMITED", id: "cat-hyper-limited", match: (p) => p.level === "HYPER-LIMITED" },
  { num: "07", label: "COFFEE SETS", id: "cat-coffee-sets", match: (p) => /\bSET\b/i.test(p.title) },
];

const getHeaderHeight = () =>
  document.querySelector("header")?.getBoundingClientRect().height ?? 71;

/* Smooth-scroll to a section, offset by the fixed header (top info row + nav). */
const jumpToSection = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
  window.scrollTo({ top, behavior: "smooth" });
};

/* Right-aligned pill links (EQUIPMENT / APPAREL). Pill/outline, thin border,
   transparent (over the cream bar), centered uppercase text. */
const ShopPill = ({ label }: { label: string }) => (
  <button
    type="button"
    className="rounded-full border border-ink/60 bg-transparent text-center transition-colors hover:bg-[#ebe7d8]"
    style={{
      ...rmFont(false),
      fontSize: 11,
      letterSpacing: "-0.2px",
      lineHeight: "13px",
      color: ink,
      padding: "2px 20px",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </button>
);

const CategoryNav = ({
  enabled,
  activeId,
}: {
  /** ids of categories that actually have products (clickable). */
  enabled: Set<string>;
  /** id of the category currently in view — highlighted as current. */
  activeId?: string;
}) => (
  <nav
    // Mobile: a 3-column grid filled column-by-column (01/02/03 in col 1,
    // 04/05/06 in col 2, 07 in col 3), spanning the width. From md up it's the
    // single horizontal row as before.
    //
    // The three columns are NOT equal in the client reference (Iteration 2 PDF
    // p18): on its 320 canvas they start at x 6.5 / 122.5 / 240, i.e. 116 and
    // 117.5 wide against the 308.5 the sub-bar leaves after its padding — hence
    // 37.6% / 38.1% / rest. Equal thirds put column 3 at 215 and ran "COFFEE
    // SETS" off the canvas, which is why "COMPETITION" and "07" collided.
    //
    // gap-y closes to the reference's 18.85px row pitch: the 10px line box the
    // items carry plus 8.85 of gap.
    className="grid max-md:grid-cols-[37.6%_38.1%_1fr] md:grid-cols-3 grid-flow-col grid-rows-3 justify-items-start gap-x-0 max-md:gap-y-[min(2.78vw,11.9px)] md:gap-y-3 w-full self-start max-md:mt-[8px] md:mt-[5px] md:flex md:w-auto md:grid-rows-1 md:items-start md:gap-x-9 md:gap-y-0"
  >
    {CATEGORIES.map((c) => {
      const isEnabled = enabled.has(c.id);
      const isActive = c.id === activeId;
      return (
        <button
          key={c.id}
          onClick={() => isEnabled && jumpToSection(c.id)}
          disabled={!isEnabled}
          // Size/leading live in classes, not in `style`, so mobile can take the
          // reference's 8px/10px on the 320 canvas while desktop keeps 12/14.
          // (An inline fontSize would beat the class at every width.)
          // Desktop drops one step (12 -> 11) so the level links read as
          // secondary to the big section title they sit beside.
          className="text-[min(2.5vw,10.7px)] leading-[min(3.13vw,13.4px)] gap-[min(1.25vw,5.4px)] md:text-[11px] md:leading-[13px] md:gap-[6px] md:px-1 md:rounded md:transition-colors md:hover:bg-[#ebe7d8]"
          style={{
            ...rmFont(false),
            letterSpacing: "-0.2px",
            color: ink,
            background: "none",
            border: "none",
            padding: 0,
            cursor: isEnabled ? "pointer" : "default",
            opacity: isEnabled ? 1 : 0.35,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            display: "inline-flex",
          }}
          /* Hover is the cream wash (#ebe7d8) applied via the class above —
             the old dimming of the ink colour is gone, so the label stays
             fully legible while it highlights. */
        >
          <span style={rmFont(true)}>{c.num}</span>
          <span style={rmFont(false)}>{c.label}</span>
        </button>
      );
    })}
  </nav>
);


/* The large active-section title that lives in the single fixed bar. Only the
   text swaps (push-up animation) when the active section changes — the bar,
   category nav and pills stay put. Matches the inline section headings. */
const TITLE_H = 56;
const TITLE_FONT = 40;
/* Desktop width reserved for the section title. Sized for the longest label
   ("06 HYPER LIMITED") so the slot never re-measures: the level links beside it
   then hold their position while scrolling instead of shifting each time the
   active section changes. Verified against the rendered title width. */
const TITLE_SLOT_W = 392;
const TITLE_TRACKING = -2.4;
const TITLE_GAP = 12;
// Mobile shrinks the title (smaller row + font) so the two divider lines
// bracketing it sit closer and the reserved title space above the products
// (which equals this height) is smaller too. 25px in a 36px row is the client
// reference (Iteration 2 PDF p18) on its 320 canvas: it puts the title's cap
// band at 185.8–204.7 between divider lines at 175.2 and 214.9. The desktop
// -2.4px of tracking is -0.06em, which at 25px would pull the line 17px in from
// the reference's 174.5 width — hence -1px here.
const TITLE_H_MOBILE = 36;
const TITLE_FONT_MOBILE = 25;
const TITLE_TRACKING_MOBILE = -1;
const TITLE_GAP_MOBILE = 6;

const TitleText = ({
  num,
  label,
  h = TITLE_H,
  fontSize = TITLE_FONT,
  tracking = TITLE_TRACKING,
  gap = TITLE_GAP,
}: {
  num: string;
  label: string;
  h?: number;
  fontSize?: number;
  tracking?: number;
  gap?: number;
}) => (
  <div
    className="flex items-baseline whitespace-nowrap uppercase"
    style={{ height: h, gap }}
  >
    <span style={{ fontSize, fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 700, letterSpacing: `${tracking}px`, lineHeight: `${h}px` }}>
      {num}
    </span>
    <span style={{ fontSize, fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 400, letterSpacing: `${tracking}px`, lineHeight: `${h}px` }}>
      {label}
    </span>
  </div>
);

/* Distance, in px, over which the title cross-fade runs. A larger range makes
   the hand-off feel more gradual: the outgoing title keeps sliding up while the
   incoming one rises from below over a longer stretch of the vertical scroll. */
const TRANSITION_RANGE = 240;

/* Where the cross-fade FINISHES, measured as the incoming section's distance to
   the pin line. It must be strictly greater than ACTIVE_EPS: the swap has to be
   visually complete a few px BEFORE the active section flips, otherwise the bar
   is mid-fade when `activeId` changes and the titles snap (the "random"/glitched
   swap: a half-faded old title left hanging over the new one). */
const TRANSITION_END = 10;

/* Tolerance (px) for treating a section as "docked" at the bar/pin line. The
   pinned horizontal scroll settles each section's top exactly on the line, so
   the active-section test must trigger at ~0 — never at a negative offset the
   pinned section can never reach. */
const ACTIVE_EPS = 2;


/* Scroll-driven cross-fade: the outgoing title slides up and the incoming title
   rises from below as the next section approaches the pin line. Both titles are
   rendered together so the swap is continuous and reversible. */
const ScrollingSectionTitle = ({
  from,
  to,
  progress,
  h = TITLE_H,
  fontSize = TITLE_FONT,
  tracking = TITLE_TRACKING,
  gap = TITLE_GAP,
}: {
  from: { num: string; label: string };
  to: { num: string; label: string };
  progress: number;
  h?: number;
  fontSize?: number;
  tracking?: number;
  gap?: number;
}) => {
  const t = Math.min(1, Math.max(0, progress));
  // Smoothstep: softer than easeInOutCubic at both ends, so the title move
  // feels buttery even when the user scrolls very slowly.
  const eased = t * t * (3 - 2 * t);
  return (
    <div className="relative overflow-hidden shrink-0" style={{ height: h }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translateY(${-eased * 100}%)`,
          opacity: 1 - eased,
          transition: "none",
          willChange: "transform, opacity",
        }}
      >
        <TitleText num={from.num} label={from.label} h={h} fontSize={fontSize} tracking={tracking} gap={gap} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translateY(${(1 - eased) * 100}%)`,
          opacity: eased,
          transition: "none",
          willChange: "transform, opacity",
        }}
      >
        <TitleText num={to.num} label={to.label} h={h} fontSize={fontSize} tracking={tracking} gap={gap} />
      </div>
    </div>
  );
};

const Shop = () => {
  const { data: products, isLoading, isError } = useShopifyStorefrontProducts();

  // Group products per category; keep only the ones that have at least one.
  const sections = useMemo(() => {
    const list = products ?? [];
    return CATEGORIES.map((c) => ({ ...c, products: list.filter(c.match) })).filter(
      (c) => c.products.length > 0,
    );
  }, [products]);

  const enabled = useMemo(() => new Set(sections.map((s) => s.id)), [sections]);
  const [activeId, setActiveId] = useState<string | undefined>(sections[0]?.id);
  const [transitionProgress, setTransitionProgress] = useState(0);

  // Shrink the sticky-bar title on mobile so the divider lines above/below it
  // sit closer (matches the inline section titles, which shrink via CSS).
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const titleH = isMobile ? TITLE_H_MOBILE : TITLE_H;
  const titleFont = isMobile ? TITLE_FONT_MOBILE : TITLE_FONT;
  const titleTracking = isMobile ? TITLE_TRACKING_MOBILE : TITLE_TRACKING;
  const titleGap = isMobile ? TITLE_GAP_MOBILE : TITLE_GAP;

  // Active category drives the large title shown in the single fixed bar.
  // The bar renders both the current and next titles so the cross-fade is
  // continuous; when there is no next section, the next title is the same as
  // the current one, which keeps the bar stable at the bottom of the page.
  const activeSection =
    sections.find((s) => s.id === activeId) ?? sections[0] ?? CATEGORIES[0];
  const activeIdx = sections.findIndex((s) => s.id === activeSection.id);
  const nextSection = sections[activeIdx + 1];
  const activeCat = activeSection;
  const nextCat = nextSection ?? activeCat;
  /* Once the bar has visually swapped to the incoming title, that section's own
     inline title must stop rendering, or the same name reads twice on screen. */
  const swappingInId =
    nextSection && transitionProgress > 0.5 ? nextSection.id : undefined;


  // Deep link from the menu search (/shop#cat-…): once the sections have
  // rendered, jump to the hashed category. Runs once per page load.
  const [hashHandled, setHashHandled] = useState(false);
  useEffect(() => {
    if (hashHandled || sections.length === 0) return;
    const id = window.location.hash.slice(1);
    if (id && sections.some((s) => s.id === id)) {
      // Let the sections paint before measuring scroll offsets.
      requestAnimationFrame(() => jumpToSection(id));
    }
    setHashHandled(true);
  }, [sections, hashHandled]);

  // Scroll-spy + transition progress. The active section is the last one whose
  // top has reached the bar (pin line). Because the pinned horizontal scroll
  // parks each section's top exactly on the line and never lets it travel
  // above, the trigger is ~0 — not a negative offset (which never fired and
  // left the previous section's title stuck in the bar while the new section's
  // inline title showed below it). Progress (0..1) tracks the next section over
  // its final approach to the line so the outgoing title pushes up & out just
  // as the upcoming one docks — a single clean swap, never two visible bars.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const headerH = getHeaderHeight();
      let curIdx = 0;
      for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i].id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top - headerH;
        if (top <= ACTIVE_EPS) curIdx = i;
      }
      const currentId = sections[curIdx]?.id;
      const next = sections[curIdx + 1];
      let p = 0;
      if (next) {
        const el = document.getElementById(next.id);
        if (el) {
          const top = el.getBoundingClientRect().top - headerH;
          // Finishes at TRANSITION_END (a few px above the pin line) so the
          // cross-fade is already at 1 when `activeId` flips — no snap.
          p = Math.max(
            0,
            Math.min(1, (TRANSITION_RANGE - top) / (TRANSITION_RANGE - TRANSITION_END)),
          );
        }
      }
      setActiveId((prev) => (prev !== currentId ? currentId : prev));
      setTransitionProgress((prev) => (Math.abs(prev - p) > 0.001 ? p : prev));

    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [sections]);

  return (
    <div className="min-h-screen bg-background">
      <WholesaleHeader
        compact
        fixed
        // The Shop bar pins over the scrolling product sections, so it must be
        // opaque (cream) — a transparent bar would let products/titles/buttons
        // bleed through and visually mix with the fixed nav. `solid` forces the
        // site-standard cream fill instead of the default transparent compact bar.
        solid
        subBar={
          <div
            /* Mobile stacks the bar vertically — category grid on top (full
               width, with a divider under it), then the big current-section
               title, then the Equipment/Apparel pills. From md up it's the
               single horizontal row as before (title, nav, pills). */
            /* Mobile gap is 0: the reference stacks the category band straight
               onto the title band with only their shared divider between them,
               so the 6px gap here showed up as a 46px title band against the
               reference's 39.7. */
            /* md:items-start so the level links line up with the TOP of the big
               section title instead of floating at its vertical centre. */
            /* relative + bg-bg-cream + overflow-hidden: the bar owns its own
               opaque box and clips anything that tries to cross it, so a title
               mid-swap (or a product row scrolling underneath) can never leak
               into the nav band. */
            className="relative z-10 bg-bg-cream overflow-hidden flex flex-col w-full max-md:gap-0 md:flex-row md:items-start md:gap-5"

          >
            {/* Fixed slot on desktop, wide enough for the longest title
                ("06 HYPER LIMITED"). Without it the bar re-measured on every
                section change, so the level links jumped left and right while
                scrolling. */}
            <div
              className="order-2 md:order-1 shrink-0"
              style={isMobile ? undefined : { width: TITLE_SLOT_W }}
            >
              <ScrollingSectionTitle from={{ num: activeCat.num, label: activeCat.label }} to={{ num: nextCat.num, label: nextCat.label }} progress={transitionProgress} h={titleH} fontSize={titleFont} tracking={titleTracking} gap={titleGap} />
            </div>
            {/* On mobile the divider below the category grid must run edge to
                edge like the others. The sub-bar pads 7 on each side there, so
                bleed the box out by that amount and re-pad the content so the
                grid stays put while the border spans the full width. */}
            {/* md:ml-8 pushes the whole level-link group further right of the
                fixed title slot, per the mockup. */}
            <div className="order-1 md:order-2 max-md:w-[calc(100%+14px)] md:w-auto md:ml-8 border-b-2 max-md:border-b border-ink/40 max-md:pb-[13px] md:border-0 md:pb-0 max-md:-ml-[7px] max-md:pl-[7px] max-md:pr-[7px]">
              <CategoryNav enabled={enabled} activeId={activeId} />
            </div>
            <div className="order-3 hidden md:flex items-center self-start mt-[8px] md:ml-auto" style={{ gap: 8 }}>
              <ShopPill label="EQUIPMENT" />
              <ShopPill label="APPAREL" />
            </div>
          </div>
        }
      />
      <FloatingCartToggle />
      <CartDrawer />

      {/* Offset the fixed header so the first pinned section parks below it */}
      <main style={{ paddingTop: "var(--site-header-h, 71px)" }}>
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
        {!isLoading && !isError && sections.length === 0 && (
          <div className="px-6 py-24 text-center text-sm uppercase tracking-widest text-muted-foreground">
            No products available.
          </div>
        )}
        {sections.map((s) => (
          <NewDropsSection
            key={s.id}
            products={s.products}
            sectionId={s.id}
            indexLabel={s.num}
            title={s.label}
            highlightActive
            // Each section renders its own inline big title + divider so the
            // upcoming section name is previewed further down the page. The
            // ACTIVE section's inline title is hidden (it lives behind the
            // fixed top bar, which already shows it) — this prevents the
            // duplicate-at-rest (two "02 BASE") while letting the fixed bar's
            // title push-swap as each new section docks under it.
            showTitle
            titleDivider
            // Hidden for the section currently shown in the fixed bar AND for
            // the incoming one as soon as the bar has swapped to its title
            // (progress past the midpoint) — otherwise the same title is
            // readable twice during the hand-off (the duplicated "02 BASE").
            inlineTitleHidden={s.id === activeId || s.id === swappingInId}

          />
        ))}
      </main>
    </div>
  );
};

export default Shop;
