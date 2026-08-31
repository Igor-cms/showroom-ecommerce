import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Shrinks an element's font size until its own content fits inside its box.
 *
 * The pills in the wholesale ORDER column are a fixed width, so the column
 * reads as one straight edge instead of a ragged one. A long variant label
 * therefore has to give way on type size rather than on width.
 *
 * This measures rather than guesses, because it has to: the labels come from
 * Shopify ("250G - $13", "BOX SET - $200", whatever is added next), so their
 * width is not knowable at build time — and the site's own face, Helvetica
 * Extended, is wider than any fallback the browser would substitute.
 *
 * The element must establish a box for clientWidth to mean anything — a flex
 * item, an inline-block, or a form control. A plain inline <span> reports 0 and
 * would be shrunk to the floor for no reason.
 */
export function useFitText<T extends HTMLElement>(
  /** Re-fit whenever this changes — the label text or the typed quantity. */
  content: unknown,
  { basePx = 10, minPx = 7 }: { basePx?: number; minPx?: number } = {},
) {
  const ref = useRef<T>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Always start from the base size: without this, a label that grew shorter
    // would keep the smaller size chosen for the previous, longer one.
    el.style.fontSize = `${basePx}px`;
    if (el.scrollWidth <= el.clientWidth) return;

    let size = Math.max(minPx, (basePx * el.clientWidth) / el.scrollWidth);
    el.style.fontSize = `${size}px`;

    /* The proportional guess assumes width scales linearly with type size.
       Kerning and sub-pixel rounding mean it can still overrun by a fraction,
       so step down until it genuinely fits. The guard stops a pathological
       layout from spinning; it is not an expected path. */
    let guard = 0;
    while (el.scrollWidth > el.clientWidth && size > minPx && guard++ < 16) {
      size = Math.max(minPx, size - 0.25);
      el.style.fontSize = `${size}px`;
    }
  }, [basePx, minPx]);

  useLayoutEffect(fit, [content, fit]);

  /* Web fonts arrive after first paint. A measurement taken against the
     fallback face is measuring the wrong font, so re-run once the real one is
     ready — otherwise every label is sized for Arial and then rendered in
     something wider. */
  useEffect(() => {
    if (typeof document === "undefined" || !("fonts" in document)) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) fit();
    });
    return () => {
      cancelled = true;
    };
  }, [content, fit]);

  return ref;
}

export default useFitText;
