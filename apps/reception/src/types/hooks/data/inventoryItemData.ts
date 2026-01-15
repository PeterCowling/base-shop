// src/types/hooks/data/inventoryItemData.ts

export interface InventoryItem {
  id?: string;
  name: string;
  unit: string;
  openingCount: number;
  reorderThreshold?: number;
  category?: string;
  active?: boolean;
  recipeMap?: Record<string, number>;
}

export type InventoryItems = Record<string, InventoryItem> | null;