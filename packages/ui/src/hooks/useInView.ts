"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal IntersectionObserver hook that respects prefers-reduced-motion.
 * Returns true when the element is in view. If disabled is true, always returns true.
 */
export default function useInView<T extends HTMLElement = HTMLDivElement>(enabled: boolean): [(node: T | null) => void, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState<boolean>(!enabled);

  useEffect(() => {
    if (!enabled) return; // no-op when not enabled
    try {
      const media = window.matchMedia(/* i18n-exempt */ "(prefers-reduced-motion: reduce)");
      if (media.matches) {
        setInView(true);
        return;
      }
    } catch {
      // ignore
    }

    const node = ref.current;
    if (!node) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            // We only need to animate once per mount
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: /* i18n-exempt */ "0px 0px -10% 0px", threshold: 0.1 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [enabled]);

  const setRef = useCallback((node: T | null) => {
    ref.current = node;
  }, []);

  return [setRef, inView];
}
