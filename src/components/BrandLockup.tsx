import nativeLogo from "../assets/native-logo-clean.png";

/* =========================================================================
 *  BrandLockup — the COMPLETE NATIVE brand lockup, identical to the Home
 *  header in its expanded (top-of-page) state: the NATIVE wordmark with
 *  ROASTERY · + · SHOWROOM set directly beneath it, each subline anchored
 *  under the matching wordmark letters (T / between / E).
 *
 *  Reused verbatim wherever the full logo is needed (e.g. the hamburger menu)
 *  so it is never shown as a reduced or simplified variant. The horizontal
 *  anchor fractions mirror the expanded-state geometry in Header.tsx; the
 *  wordmark PNG drives the width, so the whole lockup scales as one unit.
 * ========================================================================= */

const SUBLINE: React.CSSProperties = {
  position: "absolute",
  top: 2,
  fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  // Regular, not bold: the sublines read as a quiet caption under the wordmark.
  fontWeight: 400,
  lineHeight: 1,
  color: "hsl(var(--ink, 0 0% 8%))",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

/* Sizes are expressed in container-query width units (cqw = 1% of the lockup's
   own width) so the whole lockup — wordmark AND sublines — scales as a single
   unit at any width. Subline anchors follow the client-approved rules:
   ROASTERY starts at the left edge of the inverted T (37.4% of the wordmark),
   the + ends at the right edge of the I (61%), SHOWROOM ends flush with the
   right edge of the E (100%). Fractions measured on the client's mockup. */
const BrandLockup = ({ className = "" }: { className?: string }) => (
  <a
    href="/"
    aria-label="NATIVE — Roastery + Showroom"
    className={`relative block shrink-0 ${className}`}
    style={{ containerType: "inline-size" }}
  >
    {/* NATIVE wordmark — defines the lockup width. */}
    <img
      src={nativeLogo}
      alt="NATIVE"
      className="block w-full h-auto"
      style={{ mixBlendMode: "multiply" }}
    />
    {/* ROASTERY + SHOWROOM — anchored under the wordmark letters. */}
    <div className="relative w-full" style={{ height: 0 }}>
      <span style={{ ...SUBLINE, left: "37.4%", fontSize: "2.42cqw", letterSpacing: "0.24cqw" }}>
        ROASTERY
      </span>
      <span style={{ ...SUBLINE, left: "61%", transform: "translateX(-100%)", fontSize: "2.9cqw" }}>+</span>
      <span style={{ ...SUBLINE, left: "100%", transform: "translateX(-100%)", fontSize: "2.42cqw", letterSpacing: "0.24cqw" }}>
        SHOWROOM
      </span>
    </div>
  </a>
);

export default BrandLockup;
