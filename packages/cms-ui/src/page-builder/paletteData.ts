import {
  atomRegistry,
  containerRegistry,
  layoutRegistry,
  moleculeRegistry,
  organismRegistry,
  overlayRegistry,
} from "../blocks";
import type { BlockRegistryEntry } from "../blocks/types";

import type { ComponentType } from "./defaults";
import type { PaletteMeta } from "./palette.types";
import { getPalettePreview } from "./previewImages";

export const defaultIcon = "/window.svg";

export type PaletteRegistry = Record<string, BlockRegistryEntry<unknown> & { description?: string }>;

export const createPaletteItems = (registry: PaletteRegistry): PaletteMeta[] =>
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

export type PaletteCategoryDefinition = {
  id: string;
  label: string;
  order: number;
  items: PaletteMeta[];
};

type MutableCategory = {
  id: string;
  label?: string;
  order?: number;
  items: PaletteMeta[];
};

const normalizeItems = (items: PaletteMeta[]): PaletteMeta[] =>
  items.map((item) => {
    const icon = item.icon ?? item.previewImage ?? defaultIcon;
    // If the item still points at the generic default icon, inject a generated
    // schematic preview so users get a useful visual outline per section.
    const previewImageRaw = item.previewImage ?? item.icon ?? defaultIcon;
    const previewImage = previewImageRaw === defaultIcon
      ? getPalettePreview(item.type)
      : previewImageRaw;

    return {
      ...item,
      icon,
      previewImage,
    };
  });

const BASE_CATEGORY_ENTRIES: PaletteCategoryDefinition[] = (
  Object.entries(palette) as [string, PaletteMeta[]][]
).map(([id, items], index) => ({
  id,
  label: id,
  order: index,
  items: normalizeItems(items),
}));

const appPaletteRegistry = new Map<string, MutableCategory[]>();

export type AppPaletteCategory = {
  id: string;
  label?: string;
  order?: number;
  items: PaletteMeta[];
};

export const registerAppPalette = (appId: string, categories: AppPaletteCategory[]): void => {
  appPaletteRegistry.set(
    appId,
    categories.map((category) => ({
      id: category.id,
      label: category.label ?? category.id,
      order: category.order,
      items: normalizeItems(category.items),
    })),
  );
};

export const unregisterAppPalette = (appId: string): void => {
  appPaletteRegistry.delete(appId);
};

const mergeAppCategories = (installedApps: Iterable<string>): PaletteCategoryDefinition[] => {
  const merged = new Map<string, MutableCategory>();

  for (const appId of installedApps) {
    const categories = appPaletteRegistry.get(appId);
    if (!categories) continue;

    for (const category of categories) {
      const existing = merged.get(category.id);
      if (!existing) {
        merged.set(category.id, {
          id: category.id,
          label: category.label ?? category.id,
          order: category.order,
          items: [...category.items],
        });
        continue;
      }

      const existingTypes = new Set(existing.items.map((item) => item.type));
      const nextItems = [...existing.items];
      for (const item of category.items) {
        if (!existingTypes.has(item.type)) {
          nextItems.push(item);
          existingTypes.add(item.type);
        }
      }

      merged.set(category.id, {
        id: existing.id,
        label: existing.label ?? category.label ?? category.id,
        order: existing.order ?? category.order,
        items: nextItems,
      });
    }
  }

  return Array.from(merged.values()).map((category) => ({
    id: category.id,
    label: category.label ?? category.id,
    order: category.order ?? BASE_CATEGORY_ENTRIES.length,
    items: normalizeItems(category.items),
  }));
};

export const getPaletteCategories = (installedApps: Iterable<string>): PaletteCategoryDefinition[] => {
  const dynamic = mergeAppCategories(installedApps);
  return [...BASE_CATEGORY_ENTRIES.map((category) => ({ ...category, items: [...category.items] })), ...dynamic]
    .filter((category) => category.items.length > 0)
    .sort((a, b) => {
      if (a.order === b.order) return a.label.localeCompare(b.label);
      return a.order - b.order;
    });
};

export const getPaletteMap = (installedApps: Iterable<string>): Record<string, PaletteMeta[]> => {
  const map: Record<string, PaletteMeta[]> = {};
  for (const category of getPaletteCategories(installedApps)) {
    map[category.id] = category.items;
  }
  return map;
};

