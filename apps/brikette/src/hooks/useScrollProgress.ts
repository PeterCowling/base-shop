/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// src/hooks/useScrollProgress.ts
import { useCallback, useLayoutEffect, useRef, useState } from "react";

export interface ScrollProgress {
  scrolled: boolean;
  progress: number;
  mouseNearTop: boolean;
}

/**
 * Track scroll position and mouse location near the top edge.
 * Returns `{ scrolled, progress, mouseNearTop }`.
 */
function readScrollPosition(): { y: number; pct: number } {
  const y = window.scrollY;
  const docHeight = document.documentElement.scrollHeight;
  return { y, pct: docHeight ? (y / docHeight) * 100 : 0 };
}

export function useScrollProgress(): ScrollProgress {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mouseNearTop, setMouseNearTop] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const handleScroll = useCallback((): void => {
    const { y, pct } = readScrollPosition();
    setScrolled(y > 50);
    setProgress(pct);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent): void => {
    // Avoid getBoundingClientRect reflow when clientY alone satisfies the condition.
    const nearTop = e.clientY < 50 || (() => {
      const rect = headerRef.current?.getBoundingClientRect();
      return Boolean(
        rect &&
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
      );
    })();

    setMouseNearTop(nearTop);
  }, []);

  useLayoutEffect(() => {
    if (window.innerWidth < 1024) return;

    headerRef.current = document.querySelector<HTMLElement>("header[role=\"banner\"]");

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);

    const { y, pct } = readScrollPosition();
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
