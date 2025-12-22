// path: src/hooks/useScrolledPast.ts
/**
 * React hook: returns `true` when the document has been scrolled by at least
 * `threshold` pixels (commonly a banner's height).
 *
 * Uses a passive scroll listener so it never blocks the main‑thread and
 * triggers only when the threshold is crossed (debounced by `requestAnimationFrame`).
 */
import { useEffect, useRef, useState } from "react";

export function useScrolledPast(threshold: number): boolean {
  const [past, setPast] = useState(false);

  // Track last known state so we only re‑render when it actually flips
  const prev = useRef(false);

  useEffect(() => {
    const update = (): void => {
      const next = window.scrollY >= threshold;
      if (next !== prev.current) {
        prev.current = next;
        setPast(next);
      }
    };

    // initial measurement
    update();

    // schedule via rAF to avoid rapid updates in fast scroll situations
    const onScroll = (): void => {
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return past;
}
