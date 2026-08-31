import footerLogo from "../assets/footer-logo.png";

/**
 * The ©2026 / CHALLENGE THE ORDINARY / ⊥ bar that closes a page.
 *
 * Client Iteration 2 (PDF p5): "If you look at the footer of the contact page
 * you made, you did this the right way… some of the other pages have differently
 * formatted footers. Make all like the Contact footer", plus "Match the Color of
 * the bottom most banner to: F8F5E4" and "Make all text in the footer slightly
 * smaller". So this is now the Contact lockup verbatim and Contact renders it
 * from here — one definition, so they cannot drift apart again.
 *
 * Matches the Readymag mobile canvas, where the closing band is a #F8F5E4 fill
 * and CHALLENGE / THE ORDINARY sits inboard of centre rather than hard-centred.
 */
const RM_TEXT = "'custom_75139', Helvetica, Arial, sans-serif";
const RM_BOLD = "'custom_75141', Helvetica, Arial, sans-serif";

const SiteFooterBar = () => (
  <div
    className="relative"
    style={{
      zIndex: 15,
      backgroundColor: "#F8F5E4",
      borderTop: "1.5px solid rgba(14, 14, 14, 0.5)",
      width: "100%",
      height: "55px",
      flexShrink: 0,
      boxSizing: "border-box",
    }}
  >
    <div
      className="absolute left-4 top-1/2 -translate-y-1/2"
      style={{ fontSize: "9.5px", lineHeight: "11px", letterSpacing: "-0.3px", color: "#000" }}
    >
      <span style={{ fontFamily: RM_BOLD, fontWeight: 700 }}>©2026</span>
      <br />
      <span style={{ fontFamily: RM_TEXT, fontWeight: 400 }}>NATIVE</span>
    </div>
    <div
      className="absolute top-1/2 -translate-y-1/2"
      style={{
        left: "27.6%",
        fontFamily: RM_TEXT,
        fontWeight: 400,
        fontSize: "8.5px",
        lineHeight: "8.5px",
        letterSpacing: "-0.3px",
        color: "#000",
        // Right-aligned so the shorter CHALLENGE ends flush with THE ORDINARY
        // below it, as in the mockup — it used to sit ragged on the right.
        textAlign: "right",
        textTransform: "uppercase",
      }}
    >
      CHALLENGE
      <br />
      THE ORDINARY
    </div>
    <img
      src={footerLogo}
      alt="⊥"
      className="absolute right-4 top-1/2 -translate-y-1/2"
      style={{ width: "20px", height: "24px", display: "block" }}
    />
  </div>
);

export default SiteFooterBar;
