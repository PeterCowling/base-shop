"use client";

import { useEffect } from "react";

const SW_VERSION = (process.env.NEXT_PUBLIC_RECEPTION_SW_VERSION ?? "").trim();
const SW_URL = SW_VERSION ? `/sw.js?v=${encodeURIComponent(SW_VERSION)}` : "/sw.js";

/**
 * Registers the service worker for offline support.
 * Only registers in production to avoid caching issues during development.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Skip in development to avoid caching issues
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(SW_URL, { updateViaCache: "none" })
      .then((registration) => {
        // Check for updates periodically (every 30 minutes)
        setInterval(() => {
          registration.update().catch(() => undefined);
        }, 30 * 60 * 1000);
      })
      .catch(() => undefined);
  }, []);

  return null;
}
