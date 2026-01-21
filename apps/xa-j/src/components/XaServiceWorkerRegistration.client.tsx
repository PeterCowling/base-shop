"use client";

import { useEffect } from "react";

const SW_VERSION = (process.env.NEXT_PUBLIC_XA_SW_VERSION ?? "").trim();
const SW_URL = SW_VERSION ? `/sw.js?v=${encodeURIComponent(SW_VERSION)}` : "/sw.js";

export function XaServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(SW_URL, { updateViaCache: "none" })
      .catch(() => undefined);
  }, []);

  return null;
}
