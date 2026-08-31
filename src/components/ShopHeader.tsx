import React, { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import MenuOverlay, { HamburgerIcon } from "./MenuOverlay";
import ReducedLogo from "./ReducedLogo";
import AccountBadge from "./AccountBadge";

const locations = [
  { city: "MEDELLIN, COLOMBIA", coord: "6.2476° N, 75.5658° W" },
  { city: "DALLAS, U.S.", coord: "32.7767° N, 96.7970° W" },
  { city: "CHIRIQUÍ, PANAMÁ", coord: "8.3867° N, 82.2801° W" },
];

const rmFont = (bold = false): React.CSSProperties => ({
  fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
  fontWeight: bold ? 700 : 400,
});

const ink = "rgba(14,14,14,1)";

const ShopHeader = ({ subBar }: { subBar?: ReactNode }) => {
  const ref = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Expose the real header height so HorizontalPinScroll parks pinned section
  // titles just below the (taller, two-row) header instead of behind it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      const h = el.offsetHeight;
      el.setAttribute("data-compact-height", String(h));
      // Expose the real (possibly two-row) header height so pinned sections
      // and scroll anchors land just below it instead of behind it.
      document.documentElement.style.setProperty("--site-header-h", `${h}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [subBar]);

  return (
    <header
      ref={ref}
      className="fixed inset-x-0 top-0 z-40 bg-bg-cream border-b border-ink/40"
    >
      <div className="relative flex items-center" style={{ height: 72, paddingLeft: 14, paddingRight: 18 }}>

        {/* ── Reduced logo — the site-wide standard mark ── */}
        <a href="/" aria-label="NATIVE — Roastery + Showroom" className="shrink-0">
          <ReducedLogo />
        </a>

        {/* ── Locations — centered absolutely ── */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none hidden xl:block"
        >
          <div className="grid grid-cols-[auto_auto]" style={{ gap: "0 168px" }}>
            <div className="flex flex-col items-start" style={{ gap: 0 }}>
              {locations.map((l) => (
                <span
                  key={l.city}
                  style={{
                    ...rmFont(false),
                    fontSize: 14.5,
                    letterSpacing: "0px",
                    lineHeight: "18px",
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
                    fontSize: 14.5,
                    letterSpacing: "0px",
                    lineHeight: "18px",
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
            `ml-auto` sits on the group, not on the badge: the badge renders
            nothing for anonymous visitors, and hanging the push off it would
            drop the hamburger back beside the locations whenever nobody is
            signed in. Same reasoning as WholesaleHeader. */}
        <div className="ml-auto flex items-center -mr-2">
          {/* ── Signed-in marker (renders nothing when anonymous) ── */}
          <AccountBadge />

          {/* ── Hamburger — opens the shared site menu ── */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="ml-2 p-2 hover:opacity-60 transition-opacity"
          >
            <HamburgerIcon />
          </button>
        </div>
      </div>

      {/* ── Shared fullscreen menu overlay (identical to the homepage) ── */}
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ── Optional sub-bar ── */}
      {subBar && (
        <div
          className="flex items-center border-t border-ink/40 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingLeft: 14, paddingRight: 18, height: 38 }}
        >
          {subBar}
        </div>
      )}
    </header>
  );
};

export default ShopHeader;
