import { useLayoutEffect, useRef, useState } from "react";

const SignupBar = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Persistent bottom bar: fixed to the viewport bottom while the user
  // scrolls the homepage, then docks back into its natural slot (above the
  // final footer) once that slot scrolls into reach — so the footer is never
  // covered and the page ends exactly as before. The placeholder keeps the
  // bar's height reserved while it's fixed, so the footer tail's measured
  // height (used by FooterLockup's pull-up) stays stable.
  const placeholderRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(0);
  const [docked, setDocked] = useState(false);
  // On mobile the three fields + SUBMIT can't fit on one row (the button alone
  // carries 110px of side padding), so the bar stacks them and shrinks its own
  // padding — otherwise the strip overflows and gets cut off.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useLayoutEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setIsMobile(window.innerWidth < 768);
      const bar = barRef.current;
      const slot = placeholderRef.current;
      if (!bar || !slot) return;
      const h = bar.offsetHeight;
      setBarH(h);
      // Dock when the natural slot reaches where the fixed bar sits.
      const isDocked = slot.getBoundingClientRect().top <= window.innerHeight - h;
      setDocked(isDocked);
      // Publish how much of the viewport bottom the fixed bar occupies so
      // pinned sections can compute the truly visible area.
      // Mobile never floats over the viewport bottom, so it occupies 0.
      document.documentElement.style.setProperty(
        "--signup-bar-h",
        isDocked || window.innerWidth < 768 ? "0px" : `${h}px`
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    if (barRef.current) ro.observe(barRef.current);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      document.documentElement.style.removeProperty("--signup-bar-h");
    };
  }, []);

  /* Mobile metrics come from the client reference (Iteration 2 PDF p16) on the
     320 canvas: the three labels sit at 7px with a 22.85 pitch, each rule 9.9
     below its label's cap top. Solving that for this input — cap offset is
     pad + (lineHeight − 7×0.717)/2 and the rule is the element's own bottom
     border — gives 2.4 of padding and a 9 gap. It was 11px on a 35.5 pitch. */
  const inputStyle: React.CSSProperties = {
    flex: "1 1 0",
    minWidth: 0,
    border: "none",
    borderBottom: "1px solid #3c3930",
    background: "transparent",
    padding: isMobile ? "1.2px 0" : "6px 0",
    fontSize: isMobile ? "7px" : "11px",
    // Explicit on mobile: an input's `normal` line-height is ~1.5em, not the
    // ~1.15 the arithmetic above assumes, and that alone pushed the pitch to
    // 25.3 against the reference's 22.85.
    ...(isMobile ? { lineHeight: "10.5px" } : null),
    fontFamily: "Arial, sans-serif",
    letterSpacing: "0.05em",
    color: "#b5b1a8",
    outline: "none",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName("");
    setEmail("");
    setPhone("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  if (dismissed) return null;

  return (
    <div ref={placeholderRef} style={{ height: docked || isMobile ? "auto" : barH || "auto" }}>
    <div
      ref={barRef}
      style={{
        // Newsletter bar taken 1:1 from the Readymag homepage bar rectangle:
        // solid #F8F5E4 fill with a 1px #8E8A80 border (ours was #FFFBE4 @85%,
        // a brighter/whiter cream).
        backgroundColor: "#F8F5E4",
        borderTop: "1px solid #8E8A80",
        borderBottom: "1px solid #8E8A80",
        // Mobile padding is solved from the reference: the heading's cap lands
        // 7.4 below the picture above and the bar's own bottom border is the
        // full-bleed rule the reference draws 9.5 under SUBMIT.
        padding: isMobile ? "4px 6px 9.5px" : "14px 40px",
        fontFamily: "Arial, sans-serif",
        width: "100%",
        boxSizing: "border-box",
        transition: "bottom 0.25s ease",
        // Mobile never floats: the bar simply sits in the flow at the end of the
        // page, so it doesn't cover content while scrolling.
        ...(docked || isMobile
          ? { position: "relative" }
          : {
              position: "fixed",
              // Float flush at the viewport bottom while scrolling; on reaching
              // the page end it docks (relative) into the flow, directly above
              // the ©2026 bar which is the page's final in-flow strip.
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 30,
            }),
      }}
    >
      {/* Close button — lets users dismiss the newsletter bar. Sits in the
          top-right corner, above the form fields. Desktop only: it exists
          because the bar floats over the page there, and on mobile the bar is
          just a strip in the footer with nothing to get out of the way of. The
          reference draws no dismiss control. */}
      {!isMobile && (
      <button
        type="button"
        aria-label="Close newsletter signup"
        onClick={() => {
          // Free the space the bar reserved so pinned sections recompute their
          // visible area (the component renders null but stays mounted, so the
          // effect cleanup that normally clears this never runs).
          document.documentElement.style.setProperty("--signup-bar-h", "0px");
          setDismissed(true);
        }}
        style={{
          position: "absolute",
          top: "8px",
          right: "12px",
          background: "transparent",
          border: "none",
          padding: "4px",
          lineHeight: 1,
          fontSize: "18px",
          color: "#3c3930",
          cursor: "pointer",
          opacity: 0.7,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
      >
        ✕
      </button>
      )}
      {/* Taller, roomier band: heading on its own line at top-left, then the
          three long fields and the large SUBMIT button aligned on the row
          below. Extra padding gives the strip more vertical breathing room
          while the bar still measures its own height for the docking logic. */}
      <style>{`
        .signup-input::placeholder {
          color: #b5b1a8;
          font-size: ${isMobile ? "7px" : "11px"};
          opacity: 1;
        }
      `}</style>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          // Mobile: the reference puts NAME's cap 16.4 below the heading's, and
          // the two line boxes account for the rest of that.
          gap: isMobile ? "5px" : "12px",
        }}
      >
        <p
          style={{
            // 7px on mobile (reference): at 9px the line ran 288 wide and wrapped.
            fontSize: isMobile ? "7px" : "9px",
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: "0.05em",
            margin: 0,
            // The reference indents this heading ~5 further than the fields
            // below it (its ink starts at 11.9 against their 6.5).
            paddingLeft: isMobile ? "5px" : 0,
            color: "#000000",
            textTransform: "uppercase",
          }}
        >
          SIGN UP FOR NEW COFFEE DROPS, EVENT UPDATES, AND MORE...
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "flex-end",
            gap: isMobile ? "9px" : "40px",
            flexWrap: "nowrap",
          }}
        >
          <input
            type="text"
            placeholder="NAME"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="signup-input"
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signup-input"
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="PHONE NUMBER"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="signup-input"
            style={inputStyle}
          />
          <button
            type="submit"
            style={{
              // SUBMIT button colors taken 1:1 from the Readymag homepage form
              // (style "underlined"): fill #BAB5A4, cream text #F8F5E4, 60%-black
              // border. Same values on mobile and desktop in the RM export.
              backgroundColor: submitted ? "#A49F90" : "#BAB5A4",
              color: "#F8F5E4",
              border: "1px solid rgba(0,0,0,0.6)",
              // Reference draws the bar 13.9 tall with 8px bold type; ours was
              // 25.6 at 13px.
              padding: isMobile ? "1.2px 0" : "5px 110px",
              width: isMobile ? "100%" : undefined,
              fontSize: isMobile ? "8px" : "13px",
              fontFamily: "Arial, sans-serif",
              fontWeight: "bold",
              letterSpacing: "0.08em",
              textAlign: "center",
              lineHeight: 1.2,
              boxSizing: "border-box",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition:
                "background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease",
            }}
            onMouseEnter={(e) => {
              // RM hover: transparent fill, black text, same 60%-black border.
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#000000";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = submitted ? "#A49F90" : "#BAB5A4";
              e.currentTarget.style.color = "#F8F5E4";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.6)";
            }}
          >
            {submitted ? "✓ SENT" : "SUBMIT"}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default SignupBar;
