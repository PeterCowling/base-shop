import type { InventoryItem } from "../types/hooks/data/inventoryItemData";
import type { InventoryLedgerEntry } from "../types/hooks/data/inventoryLedgerData";

export interface InventorySnapshot {
  item: InventoryItem;
  onHand: number;
  lastMovementAt?: string;
  entryCount: number;
}

export function calculateOnHandQuantity(
  openingCount: number,
  entries: InventoryLedgerEntry[]
): number {
  const ledgerTotal = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  return openingCount + ledgerTotal;
}

export function buildInventorySnapshot(
  itemsById: Record<string, InventoryItem>,
  ledgerEntries: InventoryLedgerEntry[]
): Record<string, InventorySnapshot> {
  const ledgerByItem = ledgerEntries.reduce<Record<string, InventoryLedgerEntry[]>>(
    (acc, entry) => {
      if (!acc[entry.itemId]) {
        acc[entry.itemId] = [];
      }
      acc[entry.itemId].push(entry);
      return acc;
    },
    {}
  );

  return Object.entries(itemsById).reduce<Record<string, InventorySnapshot>>(
    (acc, [itemId, item]) => {
      const entries = ledgerByItem[itemId] ?? [];
      const onHand = calculateOnHandQuantity(item.openingCount, entries);
      const lastMovementAt = entries
        .map((entry) => entry.timestamp)
        .sort()
        .at(-1);

      acc[itemId] = {
        item,
        onHand,
        lastMovementAt,
        entryCount: entries.length,
      };

      return acc;
    },
    {}
  );
}