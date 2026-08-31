import { useEffect, useState } from "react";

/**
 * Sizes a hairline pair so it can scale with the screen AND still rasterise
 * cleanly — the two goals are in tension, and CSS alone can't reconcile them.
 *
 * Two 1px lines only look identical when their offset lands on a whole number
 * of DEVICE pixels: `pitch × devicePixelRatio ∈ ℤ`. A fluid `vw` pitch is
 * fractional at nearly every width, so one line ends up smeared across two
 * device rows and reads thinner than the other — visible especially at 1.25 dpr
 * (a Windows display at 125%, or 125% browser zoom). Snapping to a fixed 4px —
 * the smallest pitch that is whole at 1.25/1.5/2/3 dpr — fixes the rendering but
 * freezes the spacing while the bars keep widening. SVG + `shape-rendering:
 * crispEdges` doesn't help either: it rounds each line independently, so they
 * can land on different thicknesses (measured: 13 mismatches across widths).
 *
 * So the snap has to happen against the ACTUAL pixel grid, which only JS can
 * read. This returns the multiple of `1 / devicePixelRatio` nearest the ideal
 * proportional value — always crisp, never more than half a device pixel from
 * the design proportion. Recomputed on resize and on zoom/monitor changes.
 *
 * @param ratio    pitch as a fraction of viewport width (Readymag: 5/320)
 * @param maxPx    cap, matching where the bars themselves stop growing
 * @param fallback SSR / pre-measurement value
 */
/**
 * Blink stores lengths as LayoutUnits — 1/64 px — so a computed value is
 * rounded to this grid before it is ever rasterised. A pitch has to be crisp
 * AFTER that rounding, which is why simply dividing by the ratio isn't enough:
 * 4.6px becomes 4.59375, and 5.59375 × 1.25 dpr = 6.99, not 7.
 */
const LAYOUT_UNIT = 1 / 64;

/** Nearest pitch to `ideal` that is exact on BOTH the layout grid and the
 *  device grid. Powers of two keep this exact in floating point. */
const crispestPitch = (ideal: number, dpr: number) => {
  const lo = Math.max(1, ideal - 4);
  const hi = ideal + 4;
  let best = Math.round(ideal / LAYOUT_UNIT) * LAYOUT_UNIT;
  let bestDist = Infinity;
  for (let u = Math.ceil(lo / LAYOUT_UNIT); u <= Math.floor(hi / LAYOUT_UNIT); u++) {
    const px = u * LAYOUT_UNIT;
    const device = px * dpr;
    if (device !== Math.round(device)) continue;
    const dist = Math.abs(px - ideal);
    if (dist < bestDist) {
      bestDist = dist;
      best = px;
    }
  }
  return best;
};

export const useCrispPitch = (ratio: number, maxPx: number, fallback = 4) => {
  const [pitch, setPitch] = useState(fallback);

  useEffect(() => {
    const compute = () => {
      const dpr = window.devicePixelRatio || 1;
      const ideal = Math.min(window.innerWidth * ratio, maxPx);
      setPitch(crispestPitch(ideal, dpr));
    };
    compute();

    window.addEventListener("resize", compute);
    // Zooming changes devicePixelRatio without always firing resize; this media
    // query flips whenever the current ratio stops holding, so re-arm it then.
    let mq: MediaQueryList | null = null;
    const arm = () => {
      mq?.removeEventListener("change", onChange);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener("change", onChange);
    };
    const onChange = () => {
      compute();
      arm();
    };
    arm();

    return () => {
      window.removeEventListener("resize", compute);
      mq?.removeEventListener("change", onChange);
    };
  }, [ratio, maxPx]);

  return pitch;
};
