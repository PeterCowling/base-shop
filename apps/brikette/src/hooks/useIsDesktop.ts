// src/hooks/useIsDesktop.ts
// Utility hook for detecting when the viewport is at or above a desktop breakpoint.
import { useEffect, useState } from "react";

const DEFAULT_MIN_WIDTH = 1024;

function createQuery(minWidth: number): string {
  return `(min-width: ${minWidth}px)`;
}

export interface UseIsDesktopOptions {
  /**
   * Minimum viewport width (in pixels) that should be considered "desktop".
   * Defaults to `1024`, matching Tailwind's `lg` breakpoint.
   */
  minWidth?: number;
}

export function useIsDesktop(options: UseIsDesktopOptions = {}): boolean {
  const { minWidth = DEFAULT_MIN_WIDTH } = options;
  const query = createQuery(minWidth);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(event.matches);
    };

    update(mediaQuery);

    const listener = (event: MediaQueryListEvent) => update(event);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    // Safari < 14 fallback
    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(listener);
      return () => {
        if (typeof mediaQuery.removeListener === "function") {
          mediaQuery.removeListener(listener);
        }
      };
    }

    return undefined;
  }, [query]);

  return isDesktop;
}

export default useIsDesktop;
