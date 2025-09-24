// apps/cms/src/app/cms/shop/[shop]/themes/useBrandIntensity.ts
"use client";

import { useEffect, useState } from "react";
import type { BrandIntensity } from "./brandIntensity";

const STORAGE_KEY = "cms-brand-intensity";

export function useBrandIntensity(initial: BrandIntensity = "Everyday") {
  const [intensity, setIntensity] = useState<BrandIntensity>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "Value" || raw === "Everyday" || raw === "Premium" || raw === "Luxury") return raw;
      return initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, intensity);
    } catch {
      /* ignore */
    }
  }, [intensity]);

  return { intensity, setIntensity };
}

export default useBrandIntensity;

