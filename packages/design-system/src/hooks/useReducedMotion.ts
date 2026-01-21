"use client";

import { useEffect, useState } from "react";

export default function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */ "(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(!!mq.matches);
    update();
    try {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    } catch {
      // Safari <=14
      mq.addListener?.(update);
      return () => mq.removeListener?.(update);
    }
  }, []);

  return prefersReducedMotion;
}
