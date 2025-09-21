import {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
  overlayRegistry,
} from "../blocks";
import type { BlockRegistryEntry } from "../blocks/types";
import type { PaletteMeta } from "./palette.types";
import type { ComponentType } from "./defaults";

const defaultIcon = "/window.svg";

type PaletteRegistry = Record<string, BlockRegistryEntry<unknown> & { description?: string }>;

const createPaletteItems = (registry: PaletteRegistry): PaletteMeta[] =>
  (Object.keys(registry) as ComponentType[])
    .sort()
    .map((t) => ({
      type: t,
      label: t.replace(/([A-Z])/g, " $1").trim(),
      icon: registry[t]?.previewImage ?? defaultIcon,
      description: registry[t]?.description,
      previewImage: registry[t]?.previewImage ?? defaultIcon,
    }));

export const palette = {
  layout: createPaletteItems(layoutRegistry as PaletteRegistry),
  containers: createPaletteItems(containerRegistry as PaletteRegistry),
  atoms: createPaletteItems(atomRegistry as PaletteRegistry),
  molecules: createPaletteItems(moleculeRegistry as PaletteRegistry),
  organisms: createPaletteItems(organismRegistry as PaletteRegistry),
  overlays: createPaletteItems(overlayRegistry as PaletteRegistry),
} as const;

export type PaletteCategories = keyof typeof palette;

