"use client";

import { useMemo } from "react";
import { getPaletteCategories } from "../paletteData";
import type { PaletteCategoryDefinition } from "../paletteData";

export type PaletteMode = "all" | "elements" | "sections";

export default function usePaletteCategories(installedApps: string[], mode: PaletteMode) {
  return useMemo<PaletteCategoryDefinition[]>(() => {
    const cats = getPaletteCategories(installedApps);
    if (mode === "all") return cats;
    const elementsSet = new Set(["atoms", "molecules", "overlays"]);
    const sectionsSet = new Set(["containers", "organisms"]);
    return cats.filter((c) => {
      if (elementsSet.has(c.id)) return mode === "elements";
      if (sectionsSet.has(c.id)) return mode === "sections";
      const isDynamic = !elementsSet.has(c.id) && !sectionsSet.has(c.id) && !["layout"].includes(c.id);
      if (isDynamic) return mode === "sections";
      return false;
    });
  }, [installedApps, mode]);
}
