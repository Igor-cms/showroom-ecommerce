import companyLogo from "../assets/company-logo.webp";
import {
  HamburgerIcon,
  MOBILE_BAND_EDGE,
  MOBILE_BAND_ICON_BAR,
  MOBILE_BAND_ICON_TOP,
  MOBILE_BAND_ICON_WIDTH,
  MOBILE_BAND_PITCH_MAX,
  MOBILE_BAND_PITCH_RATIO,
} from "./MenuOverlay";
import { useCrispPitch } from "../hooks/useCrispPitch";

// The mobile brand header (< md): a two-row block shared by every page so the
// header is identical everywhere — row 1 is the ⊥ mark + tagline + hamburger,
// row 2 is the locations with coordinates. No morph, no NATIVE wordmark. The
// desktop layouts (Header's morphing logo, WholesaleHeader's reduced lockup)
// stay untouched and simply hide this on md+.

/* ⊥ mark. Sized by HEIGHT with width auto, not as a 52px square: the reference
   (Iteration 2 PDF p14/p15/p16, and identically p17/p18 — all five agree) draws
   it 22.4×28.3 on the 320 canvas, where the square rendered it 40×50, i.e. 1.78×
   too big. company-logo.webp carries transparent padding, so the box is ~29.7 to
   put the STROKE on 28.3 — the same class the menu overlay's footer mark uses,
   and the reference draws those two at the same size (22.4 vs 22.9). */
const MOBILE_MARK_CLASS = "h-[min(9.27vw,39.8px)] w-auto object-contain";

/* The inset, the icon config and the icon's vertical position are the SHARED
   mobile-band constants from MenuOverlay — this bar and the open menu's band
   have to draw the icon in the same place or it jumps. The reference starts its
   text at x 7.5 and the mark's stroke at 9.4; with width-auto sizing the mark
   carries ~0.5 of its own padding, so the shared 8px inset lands both within a
   pixel. This was px-4 (16). */
const EDGE = MOBILE_BAND_EDGE;
const BAR_PX = 1;

/* Row 1's top padding. The mark's stroke has to start at the reference's y 17.0
   and the mark box carries ~0.5 of transparent padding above it. */
const ROW1_TOP = 16.5;

const TAGLINE = [
  "ORIGIN ROASTED COFFEE COFFEE PROJECT",
  "CONNECTING YOU TO ORIGIN.",
];

const locations = [
  { city: "MEDELLIN, COLOMBIA", coord: "6.2476° N, 75.5658° W" },
  { city: "DALLAS, U.S.", coord: "32.7767° N, 96.7970° W" },
  { city: "CHIRIQUÍ, PANAMÁ", coord: "8.3667° N, 82.2901° W" },
];

/* Client Iteration 2 (p1): "…the header is still not the correct typeface. It
   looks like it's Helvetica Bold. Can it just be Helvetica regular?" — so the
   mobile header now uses the REGULAR RM face (custom_75139), matching the RM
   mobile canvas, where both the tagline and the locations are 400 weight. */
const TEXT_FONT = "custom_75139, Helvetica, Arial, sans-serif";

interface MobileBrandHeaderProps {
  /** Whether the fullscreen menu is open (hides the bar's content). */
  open?: boolean;
  /** Opens the menu when the hamburger is tapped. */
  onMenuClick: () => void;
  /** Where the ⊥ mark links to. Mirrors WholesaleHeader's prop of the same name
   *  — this used to be hardcoded to "/", so the wholesale portal's override was
   *  honoured on desktop but silently ignored on mobile, dropping visitors onto
   *  the new site's home.
   *  `null` renders the mark as plain artwork with no link at all, for the
   *  wholesale signup flow, which must offer no way out to the site. */
  logoHref?: string | null;
}

const MobileBrandHeader = ({ open = false, onMenuClick, logoHref = "/" }: MobileBrandHeaderProps) => {
  const pitch = useCrispPitch(MOBILE_BAND_PITCH_RATIO, MOBILE_BAND_PITCH_MAX);

  return (
  <div
    /* ROW1_TOP + row 2's mt put the header rule at the reference's y 54.2 — it
       sat at 75, and that 20.8px was the constant offset every mobile block
       inherited (both the shop and the menu carried it as a documented gap). */
    className="relative w-full flex flex-col justify-center pb-[13px]"
    style={{ paddingTop: ROW1_TOP, paddingLeft: EDGE, paddingRight: EDGE, opacity: open ? 0 : 1, pointerEvents: open ? "none" : "auto" }}
  >
    {/* Row 1 — mark + tagline + hamburger */}
    <div className="flex items-center">
      {/* The reference insets the mark ~1.9 further than the text it shares the
          row with (stroke at x 9.4 against the coordinates' 7.5), so it gets a
          2px nudge and the tagline gives the same 2 back — the tagline's own
          left edge (44.7) and the row's right edge stay where they were. */}
      {logoHref === null ? (
        <span className="shrink-0 ml-[2px]" aria-hidden="true">
          <img src={companyLogo} alt="" className={MOBILE_MARK_CLASS} />
        </span>
      ) : (
        <a href={logoHref} aria-label="NATIVE — Roastery + Showroom" className="shrink-0 ml-[2px]">
          <img src={companyLogo} alt="" className={MOBILE_MARK_CLASS} />
        </a>
      )}
      <div
        className="ml-[11px] self-start uppercase text-black"
        style={{
          fontFamily: TEXT_FONT,
          fontWeight: 400,
          // RM mobile canvas (320 wide): tagline is 7px/8px line, ls 0.1px —
          // i.e. 2.1875vw. Clamped so it stops growing on tablets that still get
          // this layout. The floor is 7px, NOT 7.5: at 320 the vw term is exactly
          // 7 and a 7.5 floor overrode it, setting the two lines 170 wide where
          // the reference has them at 158 — the whole 7% the tagline ran over.
          fontSize: "clamp(7px, 2.1875vw, 9.4px)",
          lineHeight: 1.15,
          letterSpacing: "0.1px",
          whiteSpace: "nowrap",
        }}
      >
        {TAGLINE.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        // marginTop pulls the icon off row 1's flow and onto the shared band
        // position, so it lands exactly where the menu overlay's close button
        // will draw it. The reference puts the bars at y 18.9–24.9.
        style={{ marginTop: MOBILE_BAND_ICON_TOP - ROW1_TOP }}
        className={`ml-auto self-start z-50 pl-3 pr-0 hover:opacity-60 transition-opacity ${
          open ? "opacity-0 pointer-events-none" : ""
        }`}
      >
        {/* RM draws the mobile hamburger as two 1px strokes at rgba(0,0,0,0.5),
            26px wide with a 5px pitch on the 320 canvas — lighter and narrower
            than our default solid-black 36px bars.
            Width and spacing both scale from RM's 26×5 grid, so the icon keeps
            the same proportions on every screen. The spacing goes through
            useCrispPitch rather than a plain vw so it also lands on the device
            pixel grid — otherwise one of the two hairlines rasterises thinner
            than the other (see the hook for why CSS alone can't do this). */}
        <HamburgerIcon
          barClass={MOBILE_BAND_ICON_BAR}
          widthClass={MOBILE_BAND_ICON_WIDTH}
          gapPx={pitch - BAR_PX}
        />
      </button>
    </div>

    {/* Row 2 — locations (city + coordinates). The -mx/px pair lets the divider
        run edge to edge while the text stays inside the header padding. */}
    <div
      className="mt-[8.5px] pt-[6px] border-t border-black flex flex-col gap-0 uppercase text-black"
      style={{
        marginLeft: -EDGE,
        marginRight: -EDGE,
        paddingLeft: EDGE,
        paddingRight: EDGE,
        fontFamily: TEXT_FONT,
        fontWeight: 400,
        // RM mobile canvas: locations are 6px/7px line, ls -0.2px ⇒ 1.875vw.
        // Same floor problem as the tagline: a 6.5px floor beat the vw term's
        // exact 6 at 320 and set the coordinate column 65.5 wide where the
        // reference has 59.6.
        fontSize: "clamp(6px, 1.875vw, 8.1px)",
        lineHeight: 1.17,
        letterSpacing: "-0.2px",
      }}
    >
      {locations.map((l) => (
        <div key={l.city} className="flex justify-between whitespace-nowrap gap-6">
          <span>{l.city}</span>
          <span>{l.coord}</span>
        </div>
      ))}
    </div>
  </div>
  );
};

export default MobileBrandHeader;
