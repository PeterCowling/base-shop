import type { FilterConfig, FilterKey } from "../../lib/xaFilters";

import type { DrawerSection } from "./XaFiltersDrawer.types";

export const PRICE_PRESETS = [
  { label: "Under 100", min: 0, max: 100 },
  { label: "100-200", min: 100, max: 200 },
  { label: "200-400", min: 200, max: 400 },
  { label: "400+", min: 400, max: undefined },
] as const;

export function buildSections(filterConfigs: FilterConfig[]): DrawerSection[] {
  const items: DrawerSection[] = [];
  let insertedPrice = false;
  for (const config of filterConfigs) {
    items.push({ kind: "filter", config });
    if (config.key === "type") {
      items.push({ kind: "price" });
      insertedPrice = true;
    }
  }
  if (!insertedPrice) {
    const designerIndex = items.findIndex(
      (item) => item.kind === "filter" && item.config.key === "designer",
    );
    const insertAt = designerIndex >= 0 ? designerIndex + 1 : 0;
    items.splice(insertAt, 0, { kind: "price" });
  }
  return items;
}

export function computeAppliedCount({
  draftValues,
  draftInStock,
  draftSale,
  draftNewIn,
  draftMin,
  draftMax,
}: {
  draftValues: Record<FilterKey, Set<string>>;
  draftInStock: boolean;
  draftSale: boolean;
  draftNewIn: boolean;
  draftMin: string;
  draftMax: string;
}): number {
  let count = 0;
  for (const set of Object.values(draftValues)) {
    count += set.size;
  }
  if (draftInStock) count += 1;
  if (draftSale) count += 1;
  if (draftNewIn) count += 1;
  if (draftMin !== "") count += 1;
  if (draftMax !== "") count += 1;
  return count;
}
