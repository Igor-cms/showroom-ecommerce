import { useEffect } from "react";
import tMark from "@/assets/t-cream.png";

/* =========================================================================
 *  useLoginBootGate — lifts the boot screen painted by index.html, once, when
 *  the login entry is genuinely finished.
 *
 *  The entry is assembled from pieces that arrive independently: the bundle,
 *  the auth round-trips, the background photo, the brand mark. Revealing each
 *  as it lands is what made the page look like it was being drawn in front of
 *  the visitor. This holds the loader up until every one of them is done, so
 *  the page appears complete in a single step.
 *
 *  `contentReady` is the caller's half of that: pass false while a gate is
 *  still deciding WHAT to render, so the loader also covers the auth wait.
 *  Pages with nothing to resolve pass true.
 *
 *  The photo is awaited with decode() rather than load, because a loaded but
 *  undecoded image still paints in bands on the first frame — which is the
 *  exact artefact this is here to prevent.
 * ========================================================================= */

const CRITICAL = ["/login/samuel-running.webp", tMark];

/** Safety net. The boot script has its own, longer one; this keeps a slow or
 *  dead asset from holding the page hostage while still giving it a fair go. */
const MAX_WAIT_MS = 6000;

declare global {
  interface Window {
    __nativeBootHide?: () => void;
  }
}

export function useLoginBootGate(contentReady: boolean) {
  useEffect(() => {
    if (!contentReady) return;

    let cancelled = false;
    const settled = new Set<string>();

    const hide = () => {
      if (!cancelled) window.__nativeBootHide?.();
    };

    const mark = (src: string) => {
      if (cancelled) return;
      // A cached image can report done twice (complete AND onload); the set
      // makes the count honest either way.
      settled.add(src);
      if (settled.size >= CRITICAL.length) hide();
    };

    CRITICAL.forEach((src) => {
      const img = new Image();
      const done = () => mark(src);
      img.onload = () => {
        // Decode before counting it: an image that has arrived but not been
        // decoded still paints progressively.
        img.decode().then(done, done);
      };
      img.onerror = done; // a broken asset must not hold the page back
      img.src = src;
      if (img.complete) img.decode().then(done, done);
    });

    const timer = window.setTimeout(hide, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [contentReady]);
}

export default useLoginBootGate;
