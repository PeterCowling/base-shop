// src/hooks/useScrollProgress.ts
import { useCallback, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";

export interface ScrollProgress {
  scrolled: boolean;
  progress: number;
  mouseNearTop: boolean;
}

/**
 * Track scroll position and mouse location near the top edge.
 * Returns `{ scrolled, progress, mouseNearTop }`.
 */
export function useScrollProgress(): ScrollProgress {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mouseNearTop, setMouseNearTop] = useState(false);

  const handleScroll = useCallback((): void => {
    const y = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const pct = docHeight ? (y / docHeight) * 100 : 0;

    flushSync(() => {
      setScrolled(y > 50);
      setProgress(pct);
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent): void => {
    const header = document.querySelector<HTMLElement>("header[role=\"banner\"]");
    const rect = header?.getBoundingClientRect();
    const isWithinHeader = Boolean(
      rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
    );

    flushSync(() => {
      setMouseNearTop(e.clientY < 50 || isWithinHeader);
    });
  }, []);

  useLayoutEffect(() => {
    if (window.innerWidth < 1024) return;

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);

    const y = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const pct = docHeight ? (y / docHeight) * 100 : 0;

    setScrolled(y > 50);
    setProgress(pct);
    setMouseNearTop(false);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleScroll, handleMouseMove]);

  return { scrolled, progress, mouseNearTop };
}
