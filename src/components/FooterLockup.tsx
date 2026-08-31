import { useEffect, useLayoutEffect, useRef, useState, CSSProperties } from "react";
import coffeeProcessPhoto from "../assets/coffee-process-cinematic.jpg";
import SignupBar from "./SignupBar";
import SiteFooterBar from "./SiteFooterBar";

// Full manifesto phrase. Highlighted words (CHALLENGE / THE / ORDINARY) live inline
// in their original positions and physically slide into the order
// "CHALLENGE THE ORDINARY" as the user scrolls.
const WORDS = [
  "WE", "EXIST", "TO", "ADVANCE", "PROFOUND", "HUMAN", "EXPERIENCES", "—",
  "REJECTING", "THE", "ORDINARY", "WE", "CHALLENGE", "WHAT", "IS", "EXPECTED",
  "IN", "OUR", "INDUSTRY", "UNTO", "CULTURAL", "CHANGE.",
];

// index in WORDS -> position in the final "CHALLENGE THE ORDINARY" composition.
// CHALLENGE (slot 0) is the anchor and never moves; THE (slot 1) and ORDINARY
// (slot 2) slide across to sit to its RIGHT.
const HIGHLIGHT_ORDER: Record<number, number> = {
  12: 0, // CHALLENGE
  9: 1,  // THE
  10: 2, // ORDINARY
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const FooterLockup = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // The beige tail (profit-share + newsletter + footer) is pulled up over the
  // pinned manifesto by exactly its own measured height, so the footer lands
  // flush with the viewport bottom precisely as the pin ends — no overshoot
  // or leftover scroll, at any viewport height. (A fixed -60vh broke this on
  // shorter viewports where the tail's pixel height exceeds 60vh.)
  const tailRef = useRef<HTMLDivElement>(null);
  const [tailH, setTailH] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeProgress, setFadeProgress] = useState(0);
  // On mobile the manifesto is static: the words never slide and the common
  // words keep a constant opacity (no scroll-driven convergence/fade).
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [offsets, setOffsets] = useState<{ dx: number; dy: number; scale: number }[]>([
    { dx: 0, dy: 0, scale: 1 },
    { dx: 0, dy: 0, scale: 1 },
    { dx: 0, dy: 0, scale: 1 },
  ]);


  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Measure the horizontal slide THE / ORDINARY each need so they land right
  // AFTER CHALLENGE — which itself never moves — forming the single line
  // "CHALLENGE THE ORDINARY". All three already share line 2, so the move is
  // horizontal only (dy = 0), same size (scale = 1).
  const measure = () => {
    const chal = wordRefs.current[12]; // CHALLENGE — the fixed anchor
    const the = wordRefs.current[9];   // THE
    const ord = wordRefs.current[10];  // ORDINARY
    if (!chal || !the || !ord) {
      setOffsets([
        { dx: 0, dy: 0, scale: 1 },
        { dx: 0, dy: 0, scale: 1 },
        { dx: 0, dy: 0, scale: 1 },
      ]);
      if (tailRef.current) setTailH(tailRef.current.offsetHeight);
      return;
    }
    // Untransformed rect — strip any in-flight scroll transform first, or a
    // re-measure (resize / font load) would bake the current slide into the
    // offsets and scatter the final layout.
    const rectOf = (el: HTMLSpanElement) => {
      const prev = el.style.transform;
      el.style.transform = "none";
      const r = el.getBoundingClientRect();
      el.style.transform = prev;
      return r;
    };
    const rc = rectOf(chal);
    const rt = rectOf(the);
    const ro = rectOf(ord);
    // Natural inter-word gap = the 0.28em right margin each word carries.
    const fontPx = parseFloat(getComputedStyle(chal).fontSize) || 26;
    const gap = 0.28 * fontPx;
    // THE sits just right of CHALLENGE; ORDINARY just right of THE.
    const theLeft = rc.right + gap;
    const ordLeft = theLeft + rt.width + gap;
    // offsets indexed by slot: 0 = CHALLENGE (fixed), 1 = THE, 2 = ORDINARY.
    setOffsets([
      { dx: 0, dy: 0, scale: 1 },
      { dx: theLeft - rt.left, dy: 0, scale: 1 },
      { dx: ordLeft - ro.left, dy: 0, scale: 1 },
    ]);
    if (tailRef.current) setTailH(tailRef.current.offsetHeight);
  };

  useLayoutEffect(() => {
    let frame = 0;
    const scheduleMeasure = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    scheduleMeasure();
    // Word metrics change when the custom display font finishes loading —
    // re-measure then, or the offsets land the words in fallback-font spots.
    document.fonts?.ready.then(scheduleMeasure).catch(() => {});
    const ro = new ResizeObserver(scheduleMeasure);
    if (sectionRef.current) ro.observe(sectionRef.current);
    if (tailRef.current) ro.observe(tailRef.current);
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // Pin line = the fixed site header's bottom edge (its live, morphing
        // height). The animation begins exactly when the section's top reaches
        // that line — i.e. where the section visually starts, not behind the
        // header. This matches where the sticky child pins (top: var).
        const headerRaw = getComputedStyle(document.documentElement)
          .getPropertyValue("--site-header-h")
          .trim();
        const headerH = parseFloat(headerRaw) || 0;
        // Total scrollable distance the pin lasts. The sticky child now fits
        // the visible area exactly (100vh − header), so it stays pinned until
        // the section's very end; adding headerH here makes progress reach 1
        // precisely at max scroll — no dead tail where the text is already
        // formed but the page still scrolls.
        const total = el.offsetHeight - vh + headerH;
        const scrolled = clamp(headerH - rect.top, 0, total);
        // Spread the whole animation across the entire pinned scroll so there
        // is no "dead" stretch where the text is already formed but the user is
        // still scrolling the pin. It completes exactly as the section ends and
        // the footer follows immediately after.
        const ANIM_END = 1;
        const p = total > 0 ? clamp(scrolled / (total * ANIM_END)) : 0;
        setProgress(p);

        // Secondary-word fade scrubs with the pin progress — the same scroll
        // that moves the words. While the section is settling fully into view
        // (p ≈ 0) every word stays fully lit in the same tone; the darkening /
        // fade only begins as the user scrolls on, reaching 0 opacity exactly
        // as "CHALLENGE THE ORDINARY" finishes forming.
        setFadeProgress(p);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Color fade is now driven directly by the paragraph's top reaching the
  // viewport center (fadeProgress). Movement still scrubs with section pin.
  // Movement scrubs directly with scroll progress so the letters of
  // CHALLENGE THE ORDINARY converge gradually as the user scrolls.
  // Hold THE / ORDINARY in place for the first slice of the scroll, then slide
  // them across CHALLENGE over the remaining range — a slight delay so the
  // movement starts a touch after the fade begins, still finishing by the end.
  const MOVE_DELAY = 0.15;
  const movePhase = clamp((progress - MOVE_DELAY) / (1 - MOVE_DELAY));
  // Mobile keeps both at 0: no horizontal slide (translate stays at 0) and no
  // opacity fade (the common words hold their starting alpha) — a static phrase.
  const easedColor = isMobile ? 0 : easeInOut(fadeProgress);
  const easedMove = isMobile ? 0 : easeInOut(movePhase);


  const wordStyle = (index: number): CSSProperties => {
    const highlight = index in HIGHLIGHT_ORDER;
    // The reference sets the em dash closed up — "EXPERIENCES—REJECTING", with
    // no space on either side. Dropping the inter-word margin on EXPERIENCES (6)
    // and on the dash (7) closes both gaps. Doing it here rather than merging
    // the two into one WORDS entry: that array is what the desktop animation
    // indexes into (HIGHLIGHT_ORDER and the wordRefs the slide is measured
    // from), so shortening it would shift CHALLENGE / THE / ORDINARY and change
    // the signed-off desktop composition. Mobile-only, like the ORDINARY comma.
    const closedUp = isMobile && (index === 6 || index === 7);
    const base: CSSProperties = {
      display: "inline-block",
      marginRight: closedUp ? 0 : "0.28em",
      willChange: "transform, opacity, color",
    };
    if (highlight) {
      const slot = HIGHLIGHT_ORDER[index];
      const { dx } = offsets[slot] || { dx: 0, dy: 0, scale: 1 };
      // Same size, same line — horizontal slide only.
      return {
        ...base,
        position: "relative",
        zIndex: 2,
        // Readymag off-white (not pure white) at reduced opacity so the
        // darkened background image bleeds through the letters — integrated
        // and less luminous than a flat white, while still readable.
        color: "rgb(248, 245, 228)",
        opacity: 0.82,
        transform: `translate3d(${dx * easedMove}px, 0, 0)`,
        transformOrigin: "center center",
        transition: "none",
      };
    }
    // Common words: keep the Readymag off-white and fade from the starting
    // opacity down to 10% — barely visible behind the final "CHALLENGE THE
    // ORDINARY" composition, but never fully gone.
    const alpha = lerp(0.82, 0.1, easedColor);
    return {
      ...base,
      color: `rgba(248, 245, 228, ${alpha})`,
      opacity: 1,
    };
  };


  return (
    <>
      {/* ── WE EXIST manifesto section: pinned, scroll-driven ── */}
      <section
        ref={sectionRef}
        className="relative w-full block"
        style={{
          // Desktop reserves 180vh of scroll for the pinned animation. Mobile is
          // static, so the section is exactly as tall as the picture — otherwise
          // the leftover height shows up as dead beige space before the signup.
          height: isMobile ? "auto" : "180vh",
          margin: 0,
          backgroundColor: "rgb(225, 220, 202)",
        }}
      >
        <div
          className="sticky z-10 w-full overflow-hidden"
          style={{
            // Mobile: taller than the photo's own 3.11:1 ratio, so object-cover
            // scales the panorama up (zoom) and crops it — anchored right, so the
            // right end of the picture stays in frame.
            ...(isMobile
              ? { height: "auto", aspectRatio: "320 / 242" }
              : { height: "calc(100vh - var(--site-header-h, 0px))" }),
            top: "var(--site-header-h, 0px)",
          }}
        >
          <img
            src={coffeeProcessPhoto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover md:object-center"
            // Mobile: 100% would pin the photo's right edge to the frame's right
            // edge; easing it back slides the picture right, showing a bit more
            // of the left side.
            style={
              isMobile
                ? {
                    objectPosition: "62% 50%",
                    // Lifts the night shot: brighter, a touch more contrast and
                    // saturation so the cherries and skin read instead of going
                    // to mud.
                    filter: "brightness(1.35) contrast(1.08) saturate(1.1)",
                  }
                : undefined
            }
          />
          {/* Darkening veil so the cream text reads over the photo. Lighter on
              mobile, where the picture is the focus and the text sits on only
              the top strip of it. */}
          <div className="absolute inset-0 bg-ink/30 md:bg-ink/55" />

          {/* Manifesto paragraph */}
          <div
            className="absolute inset-0 flex flex-col justify-start max-md:px-[7px] px-2 lg:px-4"
            /* Mobile: the reference (Iteration 2 PDF p16 / RM home canvas) starts
               the paragraph 11.2 below the picture's top edge, at the shared 7px
               inset. It was sitting 3.2 down at px-2. */
            style={{ paddingTop: isMobile ? "11px" : "clamp(0px, 0.5vh, 8px)" }}
          >
            <p
              ref={paragraphRef}

              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 400,
                // Mobile 13/15 is the reference's own size (RM sets the block at
                // 13px and fits the four fixed lines in 60.2). At 14px they no
                // longer fit the 320 measure and each one wrapped, turning the
                // four-line paragraph into six.
                fontSize: isMobile ? "13px" : "26px",
                lineHeight: isMobile ? "15px" : "26px",
                textTransform: "uppercase",
                // Mobile tightens to -0.8 (-0.062em): our face sets the third
                // line, "CHALLENGE WHAT IS EXPECTED IN OUR INDUSTRY", at 310.4
                // against the 306 the 320 canvas leaves, so at -0.6 it wrapped
                // and the four-line paragraph became five. Readymag fits the
                // same four lines in 305.6 — the same width gap the menu showed
                // between its face and ours.
                letterSpacing: isMobile ? "-0.8px" : "-0.6px",
                textAlign: "left",
                // Mobile uses the full column so the four fixed lines still fit
                // at a larger size; desktop keeps the 92% measure.
                maxWidth: isMobile ? "100%" : "min(1200px, 92%)",
                margin: 0,
              }}
            >
              {(() => {
                // The reference punctuates "THE ORDINARY, WE" on mobile. The
                // comma cannot go into WORDS: index 10 is one of the words that
                // slides into the desktop "CHALLENGE THE ORDINARY" lockup, and
                // it would end up punctuating that composition. Appending it at
                // render time, mobile only, leaves the desktop animation alone.
                const renderWord = (i: number) => (
                  <span
                    key={i}
                    ref={(el) => (wordRefs.current[i] = el)}
                    style={wordStyle(i)}
                  >
                    {WORDS[i]}
                    {isMobile && i === 10 ? "," : ""}
                  </span>
                );
                // Mobile: the four fixed lines from the reference — each one
                // starts and ends on the same word at any width. Only possible
                // here because the mobile manifesto is static: these breaks split
                // "ORDINARY | CHALLENGE", which the desktop slide (horizontal
                // only) needs on a single line.
                if (isMobile) {
                  return (
                    <>
                      {/* WE EXIST TO ADVANCE PROFOUND HUMAN */}
                      <span style={{ display: "block" }}>{[0, 1, 2, 3, 4, 5].map(renderWord)}</span>
                      {/* EXPERIENCES — REJECTING THE ORDINARY WE */}
                      <span style={{ display: "block" }}>{[6, 7, 8, 9, 10, 11].map(renderWord)}</span>
                      {/* CHALLENGE WHAT IS EXPECTED IN OUR INDUSTRY */}
                      <span style={{ display: "block" }}>
                        {[12, 13, 14, 15, 16, 17, 18].map(renderWord)}
                      </span>
                      {/* UNTO CULTURAL CHANGE. */}
                      <span style={{ display: "block" }}>{[19, 20, 21].map(renderWord)}</span>
                    </>
                  );
                }
                // Desktop: explicit, fixed three-line break — independent of width.
                return (
                  <>
                    {/* Line 1: WE EXIST TO ADVANCE PROFOUND HUMAN EXPERIENCES — */}
                    <span style={{ display: "block" }}>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(renderWord)}
                    </span>
                    {/* Line 2: REJECTING THE ORDINARY WE CHALLENGE WHAT IS */}
                    <span style={{ display: "block" }}>
                      {renderWord(8)}
                      {/* "THE ORDINARY WE CHALLENGE" must never break apart */}
                      <span style={{ whiteSpace: "nowrap" }}>
                        {[9, 10, 11, 12].map(renderWord)}
                      </span>
                      {renderWord(13)}
                      {renderWord(14)}
                    </span>
                    {/* Line 3: EXPECTED IN OUR INDUSTRY UNTO CULTURAL CHANGE. */}
                    <span style={{ display: "block" }}>
                      {[15, 16, 17, 18, 19, 20, 21].map(renderWord)}
                    </span>
                  </>
                );
              })()}
            </p>
          </div>
        </div>
      </section>

      {/* ── Newsletter tail. Only the dismissible signup bar remains here (the
            ©2026 bar now lives at the bottom of the pinned picture). It is
            pulled up by its own measured height so it settles flush exactly as
            the pin ends — the manifesto stays the last screen, no extra scroll. ── */}
      <div
        ref={tailRef}
        style={{
          position: "relative",
          zIndex: 20,
          // The pull-up only makes sense over the desktop pin; on mobile the
          // signup simply follows the picture.
          marginTop: isMobile ? 0 : `-${tailH}px`,
        }}
      >
        <SignupBar />

        {/* ©2026 closing bar — the shared SiteFooterBar, so the home page uses
            the very same lockup as Contact instead of its own copy (the two had
            drifted apart in size, leading, colour and alignment).

            It stays INSIDE the measured tail: the pull-up above subtracts the
            tail's FULL height (signup + this bar), so the strip does not
            lengthen the page — the pin still ends exactly where it did and the
            manifesto phrase stays on screen at max scroll. */}
        <SiteFooterBar />
      </div>
    </>
  );
};

export default FooterLockup;
