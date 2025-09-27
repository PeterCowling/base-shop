"use client";

import { useMemo } from "react";
import type { PaletteMeta } from "../palette.types";
import type { PaletteCategoryDefinition } from "../paletteData";

export default function usePaletteIndex(categories: PaletteCategoryDefinition[]) {
  return useMemo(() => {
    const index = new Map<string, PaletteMeta>();
    for (const category of categories) {
      for (const item of category.items) index.set(item.type, item);
    }
    return index;
  }, [categories]);
}
