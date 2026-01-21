import type { SelectionState } from "@acme/product-configurator";

export type ManufacturingEntry = {
  match: Record<string, string>;
  sku: string;
  bom: string[];
  productionNotes?: string[];
};

export type ManufacturingMap = {
  skus?: ManufacturingEntry[];
};

export function resolveManufacturingMatch(
  selections: SelectionState,
  map: ManufacturingMap,
) {
  const entries = map.skus ?? [];
  for (const entry of entries) {
    const match = entry.match ?? {};
    const matchesAll = Object.entries(match).every(
      ([key, value]) => selections[key] === value,
    );
    if (matchesAll) return entry;
  }
  return null;
}

