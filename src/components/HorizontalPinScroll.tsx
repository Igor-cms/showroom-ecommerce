import { useEffect, useRef, useState, ReactNode } from "react";

// Slightly darker than the page cream (--bg-cream: 51 59% 93%), used to dim the
// section that currently has horizontal-scroll priority (cursor over / scrolling).
const ACTIVE_BG = "hsl(51 59% 88%)";

interface HorizontalPinScrollProps {
  children: ReactNode;
  /** Optional non-translating content rendered above the horizontal track. */
  header?: ReactNode;
  /** Kept for API compat — ignored. The section keeps its natural height. */
  heightVh?: number;
  /** Tailwind className applied to the outer section. */
  className?: string;
  /** Mobile breakpoint (px). Below this, falls back to native swipe. */
  mobileBreakpoint?: number;
  /** When true, the header is sticky under the fixed site header so each
   *  section title pins while its section scrolls and is pushed out by the
   *  next section's title (sticky-stack swap). Reserves its space, so the
   *  card layout is unchanged. */
  stickyHeader?: boolean;
  /** When true, the section dims slightly while the cursor is over it (i.e.
   *  while it has horizontal-scroll priority), signalling the active section. */
  highlightActive?: boolean;
}

/**
 * Natural-height horizontal carousel with wheel-to-horizontal pinning.
 * Uses requestAnimationFrame + lerp smoothing so the cards glide continuously
 * with mouse/touchpad input instead of stepping per wheel tick.
 */
const HorizontalPinScroll = ({
  children,
  header,
  className = "",
  mobileBreakpoint = 768,
  stickyHeader = false,
  highlightActive = false,
}: HorizontalPinScrollProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const EDGE_EPS = 0.75;
    // Tolerance around the pin line. Within it the section counts as pinned;
    // beyond it (up to BAND_TOLERANCE) it still counts as pinned so a slightly
    // overshot section keeps scrolling its cards instead of falling through.
    const PIN_EPS = 2;
    /* How far past the line a section may sit and still count as pinned, i.e.
       still drive its cards. Deliberately tiny: with the capture zone below the
       section lands ON the line, so no slack is needed — and slack is harmful,
       because sections here are only ~540px tall, so a generous value let a
       section that had already scrolled past keep swallowing the wheel and the
       one below it could never reach the line (visible right after a category
       jump, which parks a new section at the line with the previous one's
       carousel untouched). */
    const BAND_TOLERANCE = 8;
    /* How far past the line the corrective re-seat is still willing to pull the
       section back. Larger than the band on purpose: this is the recovery path
       for input the wheel handler never sees (Page Down, scrollbar drag). */
    const RESEAT_MAX = 120;
    // Lerp factor — higher = snappier, lower = smoother/floatier. Lowered from
    // 0.18 for a very smooth glide between coffee-level sections (back & forth).
    const LERP = 0.1;
    /* How close to the line the section must get before this handler takes the
       wheel from the browser. It has to exceed the browser's own scroll-animation
       lag: `dist` is read from getBoundingClientRect(), i.e. the RENDERED
       position, while Chrome has already committed to a target 100–300px further
       on. That lag is what let the section cross the line without a single event
       landing it, so it pinned late — title behind the nav. Still well under a
       section's height, so the next section down is never captured at the same
       time. */
    const CAPTURE_MIN = 180;
    const CAPTURE_FACTOR = 1.5; // scale with the delta: a fast scroll is caught earlier
    /* Drift that still counts as landed. Absorbs the sub-pixel gap between
       offsetHeight (integer) and getBoundingClientRect (fractional), so a
       category-nav jump never triggers a visible correction. */
    const RESEAT_EPS = 6;

    let targetX = track.scrollLeft;
    let currentX = track.scrollLeft;
    let rafId: number | null = null;
    // Latch: at most one corrective re-seat per approach.
    let reseated = false;
    // Last known pointer position, used to decide whether the cursor is over
    // this section's carousel (then we always stop there, however fast the
    // scroll) or already below it (then the page scrolls past freely).
    let pointerX: number | null = null;
    let pointerY: number | null = null;
    /* First-visit lock: the very first time this section reaches the pin line
       it ALWAYS pins, whatever the cursor is doing. It is released the moment
       the cursor leaves the carousel while pinned; after that the page scrolls
       freely and the section never force-pins again. */
    let firstLock = true;
    const isPointerInsideTrack = () => {
      if (pointerX == null || pointerY == null) return true;
      const r = track.getBoundingClientRect();
      return (
        pointerX >= r.left &&
        pointerX <= r.right &&
        pointerY >= r.top &&
        pointerY <= r.bottom
      );
    };
    const onPointerMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!firstLock) return;
      // Release the lock only once the section is actually pinned (or past the
      // line) and the cursor is thrown out of the carousel.
      const dist = section.getBoundingClientRect().top - getHeaderH();
      if (dist <= 8 && !isPointerInsideTrack()) firstLock = false;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });


    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));


    const wheelMultiplier = (e: WheelEvent) =>
      e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;

    const normalizeWheelDelta = (e: WheelEvent) => {
      const m = wheelMultiplier(e);
      return (e.deltaY + e.deltaX) * m;
    };

    const readRootVar = (name: string) => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
      const n = parseFloat(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    // Pin line = the real bottom edge of the fixed site header. Prefer the
    // live --site-header-h var (published by the header itself, so it tracks
    // the scroll morph); otherwise measure the fixed <header> directly.
    const getHeaderH = () => {
      const fromVar = readRootVar("--site-header-h");
      if (fromVar != null) return fromVar;
      const el = document.querySelector("header");
      if (el && getComputedStyle(el).position === "fixed") {
        return el.getBoundingClientRect().height;
      }
      return 71;
    };

    // Height of the fixed signup bar at the viewport bottom (0 when docked),
    // so visibility checks use the truly visible area between header and bar.
    const getSignupBarH = () => readRootVar("--signup-bar-h") ?? 0;

    // Horizontal glide toward targetX. The page itself is never scrolled from
    // here: vertical position only ever changes by the user's own wheel input,
    // so the section never lurches toward the pin line on its own.
    const tick = () => {
      let busy = false;

      const dx = targetX - currentX;
      if (Math.abs(dx) >= 0.5) {
        currentX += dx * LERP;
        track.scrollLeft = currentX;
        busy = true;
      } else if (currentX !== targetX) {
        currentX = targetX;
        track.scrollLeft = currentX;
      }

      rafId = busy ? requestAnimationFrame(tick) : null;
    };

    const ensureTick = () => {
      if (rafId == null) rafId = requestAnimationFrame(tick);
    };

    // Keep currentX in sync if anything else (touch / native scroll) moved it.
    const onScroll = () => {
      if (rafId == null) {
        currentX = track.scrollLeft;
        targetX = currentX;
      }
    };
    track.addEventListener("scroll", onScroll, { passive: true });

    const onWheel = (e: WheelEvent) => {
      if (e.defaultPrevented || e.ctrlKey || window.innerWidth < mobileBreakpoint) return;

      const d = normalizeWheelDelta(e);
      if (d === 0) return;

      const max = track.scrollWidth - track.clientWidth;
      const rect = section.getBoundingClientRect();
      const pinY = getHeaderH();
      // Signed distance from the section top to the pin line.
      // > 0: section still below the line; < 0: scrolled past it.
      const dist = rect.top - pinY;

      // Re-arm the corrective latch while the section is still below the line.
      // Must happen BEFORE the visibility guard, or scrolling back up to the
      // hero would never re-arm it and a second approach could not be corrected.
      if (dist > PIN_EPS) reseated = false;

      // The visible area ends where the fixed signup bar begins — a section
      // still hidden behind the bar is not in view yet.
      const viewportBottom = window.innerHeight - getSignupBarH();
      if (max <= 1 || rect.bottom <= 0 || rect.top >= viewportBottom) return;

      // No cursor gate: sections are ~518px tall while the viewport is much
      // taller, so the pointer is almost never over the section sitting on the
      // pin line — gating on it was exactly what let "01 NEW DROPS" scroll past
      // the nav before its carousel ran. Ownership is decided purely by which
      // section is at the pin line (only one can be, since they stack).


      // Distance at which this section takes the wheel. Scales with the delta so
      // a fast scroll is captured early enough that one event cannot jump the
      // line. This is what keeps the LANDING exact once the cursor gate above
      // has already let the event through: `dist` is read from
      // getBoundingClientRect(), i.e. the RENDERED scroll position, while the
      // browser may already be mid-animation toward a target further on. Without
      // this zone the section could cross the line between two events and pin
      // late, title behind the nav — the original "scrolls past 01 NEW DROPS"
      // report. Cursor-gating alone (the previous behaviour) does not fix that:
      // it only decides whether a section may act, not when.
      // When the pointer sits inside this section (over the carousel), the
      // section always claims the wheel while it is still above/at the line —
      // however fast the flick. That is what makes a quick scroll stop at
      // "01 NEW DROPS" instead of blowing past it. With the cursor below the
      // section, the normal speed-scaled capture zone applies, so the page
      // scrolls past freely.
      const pointerInside = isPointerInsideTrack();

      // While the first-visit lock is armed the section owns the wheel no
      // matter where the cursor is. Once released, ownership follows the cursor.
      const atPinLine = Math.abs(dist) <= Math.max(PIN_EPS, BAND_TOLERANCE);
      if (atPinLine && !firstLock && !pointerInside) return;

      const zone = firstLock
        ? Number.POSITIVE_INFINITY
        : Math.min(
            window.innerHeight * 0.5,
            Math.max(CAPTURE_MIN, Math.abs(d) * CAPTURE_FACTOR),
          );



      // Which section acts, among the (at most one, since sections stack
      // vertically and the cursor gate above already narrows it to whichever
      // one the pointer is over) still in play. Bounded on both sides so a
      // section far above the viewport cannot grab an upward flick.
      const ownsWheel = rect.bottom > pinY && Math.abs(dist) <= zone;
      if (!ownsWheel) return;
      const visualX = track.scrollLeft;

      // ── Approaching the pin line ──
      //    Inside `zone` every event is consumed, so the browser never has a
      //    scroll animation in flight and `dist` stays exact. Outside it, the
      //    page scrolls natively with its own easing.
      if (d > 0 && dist > PIN_EPS) {
        if (targetX >= max - EDGE_EPS) return; // carousel spent — release the page
        if (dist > zone) return;               // still far — leave it to the browser
        e.preventDefault();
        const before = window.scrollY;
        window.scrollBy(0, Math.min(d, dist)); // never more than the user asked for
        // Measure what the page ACTUALLY moved: if the document has no scroll
        // left, spending `dist` on paper would hand 0 to the carousel and hold
        // the page for ever.
        const rest = d - (window.scrollY - before);
        if (rest > 0) {
          targetX = clamp(targetX + rest, 0, max);
          ensureTick();
        }
        return;
      }

      // ── Same, coming back up from below the line. ──
      if (d < 0 && dist < -PIN_EPS) {
        if (targetX <= EDGE_EPS) return;
        if (-dist > zone) return;
        e.preventDefault();
        const before = window.scrollY;
        window.scrollBy(0, Math.max(d, dist));
        const rest = d - (window.scrollY - before);
        if (rest < 0) {
          targetX = clamp(targetX + rest, 0, max);
          ensureTick();
        }
        return;
      }

      // ── Corrective re-seat ──
      //    The section drifted past the line while the carousel was untouched,
      //    so it would otherwise pin with the title hidden behind the nav. Also
      //    catches input this handler never sees (Page Down, arrows, space,
      //    dragging the scrollbar, find-on-page). Latched and gated on an
      //    untouched carousel, so it can neither oscillate nor pull the page
      //    back while the user is mid-carousel.
      if (
        d > 0 &&
        dist < -RESEAT_EPS &&
        dist >= -(firstLock ? Math.max(RESEAT_MAX, rect.height) : RESEAT_MAX) &&
        targetX <= EDGE_EPS &&
        !reseated
      ) {
        reseated = true;
        e.preventDefault();
        window.scrollBy(0, dist); // dist < 0 → pulls the section back down
        targetX = clamp(targetX + d, 0, max);
        ensureTick();
        return;
      }

      // ── Pinned band: the section sits on the line, so the wheel drives the
      //    cards sideways. The page is held still (preventDefault) but is never
      //    scrolled by us. ──
      const inBandDown = d > 0 && dist <= PIN_EPS && dist >= -BAND_TOLERANCE;
      const inBandUp = d < 0 && dist >= -PIN_EPS && dist <= BAND_TOLERANCE;
      if (inBandDown || inBandUp) {
        const canMove = d > 0 ? targetX < max - EDGE_EPS : targetX > EDGE_EPS;
        // Keep holding the page while the cards are still gliding toward an
        // edge so a fast flick doesn't scroll vertically mid-animation.
        const stillGliding = d > 0 ? visualX < max - EDGE_EPS : visualX > EDGE_EPS;

        if (canMove) {
          e.preventDefault();
          targetX = clamp(targetX + d, 0, max);
          ensureTick();
        } else if (stillGliding) {
          e.preventDefault();
        }
        // Edge reached in this direction — native vertical scroll resumes.
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });

    /* ── Safety net: page-scroll watchdog ──
       A very fast flick (or momentum/smooth scrolling) can move the page
       hundreds of px between two wheel events, so the wheel handler above may
       never see the section while it is inside its capture zone and the section
       blows past the pin line. This watchdog runs on every scroll frame: if the
       section overshot the line while its carousel is still untouched, and the
       cursor is over the carousel, the page is pulled straight back so the section lands exactly on
       the line. Latched, so it can only fire once per approach. */
    let pageReseated = false;
    let scrollRaf = 0;
    const checkPage = () => {
      scrollRaf = 0;
      if (window.innerWidth < mobileBreakpoint) return;
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 1) return;
      const rect = section.getBoundingClientRect();
      const pinY = getHeaderH();
      const dist = rect.top - pinY;

      // Re-arm once the section is comfortably back below the line.
      if (dist > 24) {
        pageReseated = false;
        return;
      }
      if (pageReseated) return;
      // Only pull the page back while the first-visit lock is armed; once the
      // user has thrown the cursor out of the carousel, scrolling stays free.
      if (!firstLock) return;
      // Untouched carousel only — never yank the page while mid-carousel.
      if (targetX > EDGE_EPS || track.scrollLeft > EDGE_EPS) return;
      if (dist >= -RESEAT_EPS) return;
      // Don't chase a section already far out of view.
      if (dist < -(rect.height + window.innerHeight)) return;
      pageReseated = true;
      window.scrollBy({ top: dist, behavior: "auto" });
    };
    const onPageScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(checkPage);
    };
    window.addEventListener("scroll", onPageScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true } as any);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onPageScroll);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      track.removeEventListener("scroll", onScroll);


      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [mobileBreakpoint]);

  // Publish the title-text height so a single, page-level divider (rendered by
  // the Shop page) sits just below the pinned title as one continuous,
  // never-moving line while only the title text swaps between sections.
  useEffect(() => {
    if (!stickyHeader) return;
    const el = titleRef.current;
    if (!el) return;
    const sync = () =>
      document.documentElement.style.setProperty("--section-title-h", `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stickyHeader]);

  return (
    <section
      ref={sectionRef}
      className={`hps-section ${className}`}
      onMouseEnter={highlightActive ? () => setActive(true) : undefined}
      onMouseLeave={highlightActive ? () => setActive(false) : undefined}
      style={
        highlightActive
          ? {
              backgroundColor: active ? ACTIVE_BG : "transparent",
              transition: "background-color 160ms ease",
            }
          : undefined
      }
    >
      <div className="flex flex-col">
        {header &&
          (stickyHeader ? (
            // Title text — sticky; the only part that moves/swaps. The divider
            // below it is a single page-level fixed line (rendered by Shop), so
            // it stays perfectly still while only this text swaps.
            <div
              ref={titleRef}
              className="shrink-0"
              style={{
                position: "sticky",
                top: "var(--site-header-h, 71px)",
                zIndex: 21,
                backgroundColor: highlightActive && active ? ACTIVE_BG : "hsl(var(--background))",
                transition: "background-color 160ms ease",
              }}
            >
              {header}
            </div>
          ) : (
            <div className="shrink-0">{header}</div>
          ))}
        <div
          ref={trackRef}
          // Band height: cards keep their own size and centre vertically in it,
          // so this controls each section's vertical size. Same component on
          // Home + Shop, so both change together.
          className="hps-track flex flex-col md:flex-row items-stretch md:min-h-[50vh] md:overflow-x-auto md:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </div>
    </section>
  );
};

export default HorizontalPinScroll;
