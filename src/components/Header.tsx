import { useState, useEffect, useLayoutEffect, useRef } from "react";
import nativeLogo from "../assets/native-logo-clean.png";
import companyLogo from "../assets/company-logo.webp";
import MenuOverlay, { HamburgerIcon } from "./MenuOverlay";
import AccountBadge from "./AccountBadge";
import MobileBrandHeader from "./MobileBrandHeader";

const locations = [
  { city: "MEDELLIN, COLOMBIA", coord: "6.2476° N, 75.5658° W" },
  { city: "DALLAS, U.S.", coord: "32.7767° N, 96.7970° W" },
  { city: "CHIRIQUÍ, PANAMÁ", coord: "8.3667° N, 82.2901° W" },
];

// Gap between the city and coordinate columns. The block now lives inside the
// design-width canvas (scaled as a whole), so this is a fixed design-px value —
// the reference/image-1 spread — instead of the old viewport-based clamp that
// was needed when the block was centred on the raw viewport.
const LOCATIONS_COLUMN_GAP = "200px";

const LocationsBlock = ({ compact = false }: { compact?: boolean }) => (
  <div
    // Centred, then nudged 15px right of dead centre (client request).
    className="hidden xl:flex absolute top-1 z-20 justify-center items-start min-w-0 pointer-events-none select-none
               left-1/2 translate-x-[calc(-50%+15px)]"
    aria-hidden={false}
  >
    <div
      className="grid grid-cols-[auto_auto] min-w-0"
      style={{ columnGap: LOCATIONS_COLUMN_GAP }}
    >
      <div className="flex flex-col items-start gap-[1px] min-w-0">
        {locations.map((l) => (
          <span
            key={l.city}
            className="text-ink uppercase whitespace-nowrap text-[11px] text-left antialiased"
            style={{
              // The RM-exported Helvetica regular (same face the other headers
              // use). The old 'Helvetica Neue' stack fell back to Arial on
              // Windows and, at weight 500, read as bold.
              fontFamily: "'custom_75139', Helvetica, Arial, sans-serif",
              fontWeight: 400,
              letterSpacing: "0.2px",
              lineHeight: 1.25,
            }}
          >
            {l.city}
          </span>
        ))}
      </div>
      <div className="flex flex-col items-end gap-[1px] min-w-0">
        {locations.map((l) => (
          <span
            key={l.coord}
            className="text-ink whitespace-nowrap text-[11px] text-right antialiased"
            style={{
              // The RM-exported Helvetica regular (same face the other headers
              // use). The old 'Helvetica Neue' stack fell back to Arial on
              // Windows and, at weight 500, read as bold.
              fontFamily: "'custom_75139', Helvetica, Arial, sans-serif",
              fontWeight: 400,
              letterSpacing: "0.2px",
              lineHeight: 1.25,
            }}
          >
            {l.coord}
          </span>
        ))}
      </div>
    </div>
  </div>
);

/* ───────────────────────── Logo geometry ─────────────────────────
 * The header logo is ONE set of elements — the ⊥ mark, ROASTERY, +,
 * SHOWROOM — that exists at every scroll position. Their resting (t = 1)
 * layout is exactly the site-wide reduced logo from ReducedLogo.tsx (the mark
 * used on /wholesale-request): the ⊥ then "ROASTERY +" / "SHOWROOM" beside it.
 *
 * Scrolling up (t = 0) only spreads those same elements outward into the big
 * logo: the NATIVE wordmark fades in over the mark while ROASTERY / + /
 * SHOWROOM slide out under its letters. The texts NEVER scale — they only
 * translate; only the ⊥ mark changes size. No second reduced logo is ever
 * created, and no element is duplicated. */
const EXPANDED_H = 140; // taller big-logo bar at the top of the home page; all
                        // logo elements stay top-anchored, so only the bar grows
                        // (the scrolled/compact state is COMPACT_H, unchanged).
const COMPACT_H = 72; // tall enough to seat the 56px reduced mark like Wholesale
const PADX = 14; // left padding — the whole lockup hugs the left edge

// Big NATIVE wordmark (native aspect 627×135). LOGO_H drives the whole big
// logo — the ⊥ mark size, subline anchors and morph all derive from it, so
// bumping it scales everything together. LOGO_TOP nudges the whole big logo
// (wordmark + ⊥ + ROASTERY/+/SHOWROOM) down together; the compact state is
// independent, so only the big logo shifts.
const LOGO_H = 104;
const LOGO_W = (LOGO_H * 627) / 135; // ≈ 483px
const LOGO_TOP = 10;
// Nudge ONLY the big logo to the right. Applied to the wordmark and the big-
// state anchors, NOT to the reduced lockup, so the compact/scrolled logo keeps
// hugging the left edge (PADX) while the big logo sits slightly inward.
const BIG_SHIFT_X = 5;
// Native font size for ROASTERY / + / SHOWROOM. They render at this size
// directly (no transform scale), so the text stays crisp. Used for both the big
// logo and the compact/reduced lockup; the sublines only ever translate.
const SUB_FONT = 12.6;

// Design width the header's absolute-px logo layout is tuned for (≈ the wide
// "reference" screen where it looks right). Below this width the whole logo
// lockup scales down proportionally, so the header keeps the SAME proportions at
// any width instead of the fixed-size logo crowding smaller screens. Capped at
// 1× so it never upscales the wordmark PNG (which would blur) — on wider screens
// the logo stays at its design size. Change this single number to re-anchor.
const DESIGN_W = 1900;

// Mobile header (< MOBILE_BP): a distinct, taller layout — just the ⊥ mark plus
// a tagline beside it (no ROASTERY/+/SHOWROOM sublines, no NATIVE wordmark and
// no morph). The desktop canvas scaling would shrink the logo to ~20% at phone
// widths, so mobile gets its own fixed sizing instead.
const MOBILE_BP = 768;

// Reduced lockup metrics — kept identical to ReducedLogo.tsx.
const MARK = 56; // w-14 h-14
const GAP = 14; // gap-3.5
const LOCKUP_TOP = (COMPACT_H - MARK) / 2; // vertically centre the mark in the compact bar
// How far SHOWROOM is pulled up under "ROASTERY +" in the reduced state (px).
const SHOW_RAISE = 11;

// Big-state anchors (header coords, measured from the header top).
// T_CX is the ⊥ centre that the morphing ⊥ mark overlays. The subline anchors
// are EDGES measured from the NATIVE wordmark glyphs (fractions of LOGO_W, found
// by scanning the wordmark's ink columns): ROASTERY's left edge under the ⊥'s
// left, "+"'s right edge at the I's right, SHOWROOM's right edge at the E's right.
const T_CX = PADX + BIG_SHIFT_X + LOGO_W * 0.4615;
const ROAST_LEFT_X = PADX + BIG_SHIFT_X + LOGO_W * 0.3764; // left of ⊥
const PLUS_RIGHT_X = PADX + BIG_SHIFT_X + LOGO_W * 0.6108; // right of I
const SHOW_RIGHT_X = PADX + BIG_SHIFT_X + LOGO_W * 0.9968; // right of E
const MARK_BIG_CY = LOGO_TOP + LOGO_H / 2; // ⊥ overlays the wordmark's T
const SUB_BIG_CY = LOGO_TOP + LOGO_H + 10; // ROASTERY / + / SHOWROOM sit just below NATIVE (nudged up)
const MARK_BIG_H = LOGO_H; // ⊥ grows to roughly the wordmark cap height

// Reduced-logo text — same styling as ReducedLogo.tsx (font-normal /
// tracking-tight / leading-tight / wholesale-primary), sized natively at
// SUB_FONT so it renders crisp (no transform scaling).
const REDUCED_TEXT: React.CSSProperties = {
  fontSize: SUB_FONT,
  fontWeight: 400,
  letterSpacing: "-0.025em",
  lineHeight: 1.25,
  color: "hsl(var(--wholesale-primary))",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  display: "inline-block",
};

type Off = { dx: number; dy: number };
const ZERO_OFF: Off = { dx: 0, dy: 0 };

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [t, setT] = useState(0); // 0 = expanded, 1 = compact
  const [vw, setVw] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : DESIGN_W,
  );
  const headerRef = useRef<HTMLElement>(null);

  // Refs to the four shared elements + their positioned container, used to
  // measure each element's natural (resting / reduced) centre so the big-state
  // offset is exact — the morph therefore lands pixel-perfect on ReducedLogo.
  const lockupRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLImageElement>(null);
  const roastRef = useRef<HTMLSpanElement>(null);
  const plusRef = useRef<HTMLSpanElement>(null);
  const showRef = useRef<HTMLSpanElement>(null);

  const [off, setOff] = useState<{ mark: Off; roast: Off; plus: Off; show: Off }>({
    mark: ZERO_OFF,
    roast: ZERO_OFF,
    plus: ZERO_OFF,
    show: ZERO_OFF,
  });

  useEffect(() => {
    const RANGE = 280; // px of scroll to complete morph
    const onScroll = () => {
      const y = window.scrollY;
      const next = Math.min(1, Math.max(0, y / RANGE));
      setT(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track viewport width so the logo lockup can scale proportionally (see
  // DESIGN_W). offsetLeft-based morph measurements are unaffected by the outer
  // scale transform, so the morph stays pixel-accurate at any scale.
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Measure each element's resting centre (offset coords ignore CSS transforms,
  // so the live morph transform never pollutes the measurement) and derive the
  // translation it needs to reach its big-state anchor. Re-run on layout / font
  // changes so the sublines stay anchored even after the webfont swaps in.
  useLayoutEffect(() => {
    const measure = () => {
      const lockup = lockupRef.current;
      if (!lockup) return;
      // Resting centre in header coords. offsetLeft/Top ignore CSS transforms,
      // so the live morph transform never pollutes the measurement; we sum them
      // up the offsetParent chain to the lockup (text block is itself
      // positioned, so it is the spans' offsetParent).
      const centre = (el: HTMLElement | null) => {
        if (!el) return null;
        let x = el.offsetWidth / 2;
        let y = el.offsetHeight / 2;
        let node: HTMLElement | null = el;
        while (node && node !== lockup) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        return { x: PADX + x, y: LOCKUP_TOP + y };
      };
      const m = centre(markRef.current);
      const r = centre(roastRef.current);
      const p = centre(plusRef.current);
      const s = centre(showRef.current);
      if (!m || !r || !p || !s) return;
      // Sublines render at native size (no scale), so their half-width is just
      // offsetWidth / 2. Convert each edge anchor into the centre the element
      // must sit at for that edge to land on the wordmark glyph.
      const halfR = roastRef.current.offsetWidth / 2;
      const halfP = plusRef.current.offsetWidth / 2;
      const halfS = showRef.current.offsetWidth / 2;
      setOff({
        mark: { dx: T_CX - m.x, dy: MARK_BIG_CY - m.y },
        roast: { dx: ROAST_LEFT_X + halfR - r.x, dy: SUB_BIG_CY - r.y },
        plus: { dx: PLUS_RIGHT_X - halfP - p.x, dy: SUB_BIG_CY - p.y },
        show: { dx: SHOW_RIGHT_X - halfS - s.x, dy: SUB_BIG_CY - s.y },
      });
    };

    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    const ro = new ResizeObserver(measure);
    if (lockupRef.current) ro.observe(lockupRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Publish the real (morphing) header height so pinned sections and anchor
  // targets align with the header's actual bottom edge at any scroll position.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    document.documentElement.style.setProperty(
      "--site-header-h",
      `${el.offsetHeight}px`
    );
    // vw matters too: the header scales with the viewport width (and swaps to
    // the mobile layout below MOBILE_BP), so its height changes on resize — not
    // only on scroll. Without it the published value goes stale and anything
    // anchored to it (hero overlay, page padding, pinned sections) misaligns.
  }, [t, vw]);

  // Morph driver. `f` runs 1 → 0 as the header shrinks: 1 = big (spread out),
  // 0 = reduced (resting). Eased so the elements settle smoothly into place.
  const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
  const f = 1 - easeOutCubic(t);

  // Proportional logo scale: 1× at/above the design width, shrinking below it so
  // the lockup keeps its proportions on narrower screens instead of crowding.
  const s = Math.min(1, vw / DESIGN_W);

  // Below MOBILE_BP the header switches to its own compact-but-taller layout.
  const isMobile = vw < MOBILE_BP;

  // NATIVE wordmark covers the big state and cuts out in one go the instant the
  // morph begins — no gradual fade. The ⊥ mark takes over immediately (at full
  // size, overlaid on where the wordmark's T was) and then shrinks/travels.
  const pngOpacity = t > 0 ? 0 : 1;
  const markOpacity = t > 0 ? 1 : 0;

  const markScale = 1 + (MARK_BIG_H / MARK - 1) * f;

  return (
    <>
      {/* ── Closed header bar ── */}
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-40 bg-bg-cream border-b-2 max-md:border-b border-black transition-all duration-300"
        style={{ willChange: "height", transform: "translateZ(0)" }}
      >
        {isMobile ? (
          /* Shared mobile brand header — identical on every page. */
          <MobileBrandHeader open={isOpen} onMenuClick={() => setIsOpen(true)} />
        ) : (
        /* Header container — height morphs continuously with scroll */
        <div
          className="relative w-full overflow-hidden transition-opacity duration-200"
          style={{
            height: `${(EXPANDED_H - (EXPANDED_H - COMPACT_H) * t) * s}px`,
            opacity: isOpen ? 0 : 1,
            pointerEvents: isOpen ? "none" : "auto",
          }}
        >
          {/* ── Design-width canvas: the logo, locations and hamburger all share
              ONE DESIGN_W-wide coordinate system and scale together by `s`, so
              the distances between them stay identical to the reference design at
              every viewport width (the whole header shrinks as one piece, like
              the mockup, instead of each element anchoring to a viewport edge). ── */}
          <div
            className="absolute top-0 left-0"
            style={{
              width: DESIGN_W,
              height: EXPANDED_H - (EXPANDED_H - COMPACT_H) * t,
              transform: `scale(${s})`,
              transformOrigin: "top left",
            }}
          >
          {/* ── The single morphing logo. ── */}
          <a
            href="/"
            aria-label="NATIVE — Roastery + Showroom"
            className="absolute inset-0 block"
          >
            {/* NATIVE wordmark — the big logo's top line. Cross-fades out as
                the standalone ⊥ mark takes over; no element below depends on
                it, so it is the only piece exclusive to the big state. */}
            <img
              src={nativeLogo}
              alt=""
              style={{
                position: "absolute",
                left: PADX + BIG_SHIFT_X,
                top: LOGO_TOP,
                height: LOGO_H,
                width: "auto",
                display: pngOpacity === 0 ? "none" : "block",
                mixBlendMode: "multiply",
                opacity: pngOpacity,
                willChange: "opacity",
              }}
            />

            {/* Reduced lockup — its RESTING layout is exactly ReducedLogo.tsx.
                Each element is translated outward into the big logo by `f`. */}
            <div
              ref={lockupRef}
              style={{ position: "absolute", left: PADX, top: LOCKUP_TOP }}
            >
              {/* ⊥ mark — the only element that scales. Travels from over the
                  wordmark's T (big) down to the reduced mark slot. */}
              <img
                ref={markRef}
                src={companyLogo}
                alt=""
                style={{
                  width: MARK,
                  height: MARK,
                  objectFit: "contain",
                  transform: `translate(${off.mark.dx * f}px, ${off.mark.dy * f}px) scale(${markScale})`,
                  transformOrigin: "center center",
                  opacity: markOpacity,
                  willChange: "transform, opacity",
                }}
              />

              {/* Text block — sits to the right of the mark at rest. The spans
                  only translate (constant 14px); they never scale. */}
              <div
                style={{
                  position: "absolute",
                  left: MARK + GAP,
                  top: 0,
                }}
              >
                <div style={{ whiteSpace: "nowrap" }}>
                  <span
                    ref={roastRef}
                    style={{
                      ...REDUCED_TEXT,
                      transform: `translate(${off.roast.dx * f}px, ${off.roast.dy * f}px)`,
                      transformOrigin: "center center",
                      willChange: "transform",
                    }}
                  >
                    ROASTERY
                  </span>
                  <span
                    ref={plusRef}
                    style={{
                      ...REDUCED_TEXT,
                      transform: `translate(${off.plus.dx * f}px, ${off.plus.dy * f}px)`,
                      transformOrigin: "center center",
                      willChange: "transform",
                    }}
                  >
                    &nbsp;+
                  </span>
                </div>
                <span
                  ref={showRef}
                  style={{
                    ...REDUCED_TEXT,
                    // Raise SHOWROOM toward ROASTERY in the reduced state via
                    // transform (vertical margins are unreliable on inline-block).
                    // The raise eases out with `f`, so the big logo is untouched.
                    transform: `translate(${off.show.dx * f}px, ${off.show.dy * f - SHOW_RAISE * (1 - f)}px)`,
                    transformOrigin: "center center",
                    willChange: "transform",
                  }}
                >
                  SHOWROOM
                </span>
              </div>
            </div>
          </a>

          <LocationsBlock />

          {/* Hamburger — top-right of the DESIGN canvas, so it scales with and
              keeps its distance to the other header elements at any width. z-50
              keeps it above the full-bleed logo <a> so clicks near the icon never
              fall through to the "/" link. */}
          {/* Signed-in marker, seated to the left of the hamburger. */}
          <AccountBadge className={`absolute top-2 right-12 z-50 ${isOpen ? "opacity-0 pointer-events-none" : ""}`} />

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            className={`absolute top-1 right-1 z-50 px-3 pt-0 pb-3 hover:opacity-60 transition-opacity ${isOpen ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <HamburgerIcon large={t < 0.5} />
          </button>
          </div>
        </div>
        )}
      </header>

      {/* ── Shared fullscreen menu overlay ── */}
      <MenuOverlay open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default Header;
