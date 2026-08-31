import { useEffect, useState } from "react";

/**
 * Preloads a set of image URLs and reports when they have all finished — or a
 * safety timeout elapses. Used to hold a loading screen over a page until its
 * imagery is downloaded, so the page reveals complete instead of popping in one
 * tile at a time. Mirrors the gate on /producers, extracted so /podcast and
 * /blog share exactly the same behaviour instead of each re-implementing it.
 *
 * `srcs` MUST be stable across renders — a module constant or a memoised array.
 * A fresh array literal every render would restart the preload and could flash
 * the loader back up, so callers pass a hoisted `const`, not `list.map(...)`
 * inline.
 */
export function useImagesReady(
  srcs: readonly string[],
  timeoutMs = 6000,
): boolean {
  const [ready, setReady] = useState(srcs.length === 0);

  useEffect(() => {
    if (srcs.length === 0) {
      setReady(true);
      return;
    }
    let cancelled = false;
    const loaded = new Set<string>();
    const mark = (src: string) => {
      loaded.add(src);
      if (!cancelled && loaded.size >= srcs.length) setReady(true);
    };
    srcs.forEach((src) => {
      const img = new Image();
      const done = () => mark(src);
      img.onload = done;
      // A broken asset must not trap the page behind the loader forever.
      img.onerror = done;
      img.src = src;
      // Already cached: `complete` is true and no load event fires, so resolve
      // it synchronously here instead of waiting on an event that won't come.
      if (img.complete) done();
    });
    // Never stay stuck on one slow or broken image: reveal anyway after this.
    const t = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, timeoutMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [srcs, timeoutMs]);

  return ready;
}

export default useImagesReady;
