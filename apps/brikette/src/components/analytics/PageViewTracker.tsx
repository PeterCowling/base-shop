"use client";

// PageViewTracker — SPA page_view instrumentation (TASK-41)
//
// WHY PATTERN B:
// The inline gtag snippet in layout.tsx fires `gtag('config', MEASUREMENT_ID)`
// WITHOUT `send_page_view: false`. GA4 therefore automatically fires a page_view
// on the initial hard-load. This component must NOT fire on the first render to
// avoid double-counting. It fires only on subsequent pathname changes.
//
// If the inline snippet is ever updated to include `send_page_view: false`,
// switch to Pattern A (fire on every render including initial load).

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { GA_MEASUREMENT_ID } from "@/config/env";

type GTag = (...args: unknown[]) => void;

function getGtag(): GTag | null {
  if (typeof window === "undefined") return null;
  const gtag = (window as Window & { gtag?: GTag }).gtag;
  return typeof gtag === "function" ? gtag : null;
}

/**
 * Fires a GA4 page_view on every SPA client-side navigation.
 *
 * Next.js App Router does NOT auto-fire GA4 page_view on client-side route
 * changes — the gtag snippet only fires on the initial hard-load. This
 * component listens to pathname changes via usePathname() and fires
 * gtag('config', ...) with the updated page_path on each change.
 *
 * Pattern B: skips the first render (handled by the inline snippet) and
 * fires on subsequent navigations only.
 */
export function PageViewTracker(): null {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the initial render — the inline gtag('config', ...) snippet already
    // fires a page_view on hard load. Firing here too would double-count.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const measurementId = GA_MEASUREMENT_ID;
    if (!measurementId) return;

    const gtag = getGtag();
    if (!gtag) return;

    // Pattern B: send page_view via gtag('config', ...) on route change.
    // This mirrors what the inline snippet does on hard load.
    gtag("config", measurementId, {
      page_path: pathname,
      page_location: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }, [pathname]);

  return null;
}
