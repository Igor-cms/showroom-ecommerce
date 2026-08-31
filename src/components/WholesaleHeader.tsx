import React, { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import ReducedLogo from "@/components/ReducedLogo";
import MenuOverlay, { HamburgerIcon } from "@/components/MenuOverlay";
import MobileBrandHeader from "@/components/MobileBrandHeader";
import AccountBadge from "@/components/AccountBadge";

// Same location set + typography used by the site-standard ShopHeader so the
// wholesale header reads identically to the rest of the site.
const locations = [
  { city: "MEDELLIN, COLOMBIA", coord: "6.2476° N, 75.5658° W" },
  { city: "DALLAS, U.S.", coord: "32.7767° N, 96.7970° W" },
  { city: "CHIRIQUÍ, PANAMÁ", coord: "8.3967° N, 82.2801° W" },
];

const rmFont = (bold = false): React.CSSProperties => ({
  // Use the RM-exported Helvetica (custom_75139/41 from index.css) so the header
  // renders at the SAME proportions as the client's design — the previous
  // "Helvetica → Arial" fallback rendered visibly larger on Windows.
  fontFamily: bold
    ? "'custom_75141', Helvetica, Arial, sans-serif"
    : "'custom_75139', Helvetica, Arial, sans-serif",
  fontWeight: bold ? 700 : 400,
});

const ink = "rgba(14,14,14,1)";

/**
 * `compact` (used on /wholesale-request): shrinks the header height and pushes
 * the logo hard to the left edge and the hamburger hard to the right edge.
 */
const WholesaleHeader = ({
  compact = false,
  fixed = false,
  solid = false,
  noBorder = false,
  subBar,
  logoHref = "/",
  disableMenu = false,
}: {
  compact?: boolean;
  fixed?: boolean;
  solid?: boolean;
  /** Drop the header's bottom divider (e.g. on /producers over the scene). */
  noBorder?: boolean;
  subBar?: ReactNode;
  /** Override the logo link target (default: "/"). `null` drops the link
   *  entirely, leaving the mark as plain artwork — used by the wholesale
   *  signup flow, which must offer no way out to the site. */
  logoHref?: string | null;
  /** When true, the hamburger is inert (visible but non-functional). */
  disableMenu?: boolean;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // RM-exact compact sizes, measured against the client's design at the 1600
  // reference: the 3-line location block spans 29px there. 9px/10.5px lands on
  // that (9.5px rendered ~1px tall per line too big).
  const locSize = compact ? 9 : 14.5;
  const locLine = compact ? "11px" : "18px";

  // When fixed, publish the real header height (incl. sub-bar) so the page
  // offset, the pinned horizontal scroll and sticky section titles land just
  // below it instead of behind it.
  useLayoutEffect(() => {
    if (!fixed) return;
    const el = ref.current;
    if (!el) return;
    const sync = () =>
      document.documentElement.style.setProperty("--site-header-h", `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixed, subBar]);

  return (
    <header
      ref={ref}
      className={`${compact ? `${solid ? "bg-bg-cream" : "bg-transparent"}${noBorder ? "" : " border-b-2 border-ink/40"}` : `bg-wholesale-bg${noBorder ? "" : " border-b border-ink/40"}`}${fixed ? " fixed inset-x-0 top-0 z-40" : ""} max-md:bg-bg-cream max-md:border-b ${
        // With a sub-bar (Shop) the header's bottom edge falls BELOW the big
        // section title, so it has to match the section dividers (ink/40) — a
        // black rule there wouldn't pair with the lighter one above the title.
        // Without one (Contact/Producers/Wholesale) it sits right under the
        // coordinates and must match that solid black rule.
        subBar ? "max-md:border-ink/40" : "max-md:border-black"
      }`}
    >
      {/* Shared mobile brand header — identical to the home page. Desktop
          content (below) is hidden on mobile. */}
      <div className="md:hidden">
        <MobileBrandHeader
          open={menuOpen}
          onMenuClick={disableMenu ? () => {} : () => setMenuOpen(true)}
          logoHref={logoHref}
        />
      </div>

      <div className={`hidden md:block ${compact ? "w-full px-0 py-2" : "mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-10 py-6"}`}>
        <div className="relative flex items-center">
          {/* ── Reduced logo — links to `logoHref`; inert when it is null ── */}
          {logoHref === null ? (
            <span className="shrink-0" aria-hidden="true">
              <ReducedLogo compact={compact} className={compact ? "ml-2" : "-ml-4 sm:-ml-6 lg:-ml-10"} />
            </span>
          ) : (
            <a href={logoHref} aria-label="NATIVE — Roastery + Showroom" className="shrink-0">
              <ReducedLogo compact={compact} className={compact ? "ml-2" : "-ml-4 sm:-ml-6 lg:-ml-10"} />
            </a>
          )}

          {/* ── Locations — centered absolutely (same as ShopHeader) ── */}
          {/* The client mockup always shows the centered locations; reveal them
              from lg (was xl, which hid them on ~1280px-wide windows). */}
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none hidden lg:block ${compact ? "-mt-1.5" : ""}`}>
            {/* RM compact header separates the two columns by ~260px. */}
            <div className="grid grid-cols-[auto_auto]" style={{ gap: compact ? "0 260px" : "0 168px" }}>
              <div className="flex flex-col items-start" style={{ gap: 0 }}>
                {locations.map((l) => (
                  <span
                    key={l.city}
                    style={{
                      ...rmFont(false),
                      fontSize: locSize,
                      letterSpacing: compact ? "-0.3px" : "0px",
                      lineHeight: locLine,
                      color: ink,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                      WebkitFontSmoothing: "antialiased",
                      MozOsxFontSmoothing: "grayscale",
                    }}
                  >
                    {l.city}
                  </span>
                ))}
              </div>
              <div className="flex flex-col items-end" style={{ gap: 0 }}>
                {locations.map((l) => (
                  <span
                    key={l.coord}
                    style={{
                      ...rmFont(false),
                      fontSize: locSize,
                      letterSpacing: compact ? "-0.3px" : "0px",
                      lineHeight: locLine,
                      color: ink,
                      whiteSpace: "nowrap",
                      textAlign: "right",
                      WebkitFontSmoothing: "antialiased",
                      MozOsxFontSmoothing: "grayscale",
                    }}
                  >
                    {l.coord}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Account badge + hamburger, pinned to the right ──
              The `ml-auto` belongs to this GROUP, never to the badge. The badge
              renders nothing for anonymous visitors, so while it carried the
              push the hamburger snapped back next to the logo the moment nobody
              was signed in — which is every visitor on a public page. Holding it
              here keeps the pair on the right whether or not the badge exists,
              and it stays flex-driven, so it follows the header at any width
              instead of being pinned to a fixed offset. */}
          <div className={`ml-auto flex items-start ${compact ? "" : "-mr-2"}`}>
            {/* Signed-in marker (renders nothing when anonymous) */}
            <AccountBadge className="self-start" />

            <button
              type="button"
              onClick={disableMenu ? undefined : () => setMenuOpen(true)}
              aria-label="Open menu"
              aria-disabled={disableMenu || undefined}
              tabIndex={disableMenu ? -1 : undefined}
              /* `flex` so the icon is not pushed down by the button's inherited
                 line box — that gap left the bars ~11px below the logo and the
                 locations. items-start then seats them on the same top edge. */
              className={`self-start flex items-start px-2 pt-0 pb-2 transition-opacity ${disableMenu ? "cursor-default pointer-events-none" : "hover:opacity-60"}`}
            >
              <HamburgerIcon topPadClass="pt-0" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Shared fullscreen menu overlay (identical to the rest of the site) ── */}
      {!disableMenu && <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />}

      {/* ── Optional sub-bar (e.g. Shop category nav) ── */}
      {subBar && (
        <div
          // Mobile drops to the shared 7px inset (MOBILE_BAND_EDGE) so the Shop
          // category nav and section title line up with the coordinates above
          // them; the reference starts them at 6.5 and 14 left them at 14.5.
          className="flex items-center border-t border-ink/40 max-md:border-t max-md:border-black overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:pl-[7px] max-md:pr-[7px] md:pl-[14px] md:pr-[18px]"
          style={{ minHeight: 38, paddingTop: 2, paddingBottom: 2 }}
        >
          {subBar}
        </div>
      )}
    </header>
  );
};

export default WholesaleHeader;
