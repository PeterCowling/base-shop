import { describe, expect, it } from "vitest";

import type { InventoryItem } from "../../types/hooks/data/inventoryItemData";
import type { InventoryLedgerEntry } from "../../types/hooks/data/inventoryLedgerData";
import {
  buildInventorySnapshot,
  calculateOnHandQuantity,
} from "../inventoryLedger";

describe("inventoryLedger utils", () => {
  it("calculates on-hand from opening count and ledger entries", () => {
    const entries: InventoryLedgerEntry[] = [
      {
        itemId: "item-a",
        type: "receive",
        quantity: 10,
        user: "Pete",
        timestamp: "2025-01-01T10:00:00.000+00:00",
      },
      {
        itemId: "item-a",
        type: "sale",
        quantity: -3,
        user: "Pete",
        timestamp: "2025-01-01T12:00:00.000+00:00",
      },
    ];

    expect(calculateOnHandQuantity(5, entries)).toBe(12);
  });

  it("builds a snapshot with last movement per item", () => {
    const itemsById: Record<string, InventoryItem> = {
      "item-a": { name: "Beans", unit: "kg", openingCount: 5 },
      "item-b": { name: "Milk", unit: "l", openingCount: 2 },
    };
    const entries: InventoryLedgerEntry[] = [
      {
        itemId: "item-a",
        type: "receive",
        quantity: 10,
        user: "Pete",
        timestamp: "2025-01-01T10:00:00.000+00:00",
      },
      {
        itemId: "item-a",
        type: "sale",
        quantity: -3,
        user: "Pete",
        timestamp: "2025-01-01T12:00:00.000+00:00",
      },
      {
        itemId: "item-b",
        type: "waste",
        quantity: -1,
        user: "Cristiana",
        timestamp: "2025-01-01T09:00:00.000+00:00",
      },
    ];

    const snapshot = buildInventorySnapshot(itemsById, entries);
    expect(snapshot["item-a"]?.onHand).toBe(12);
    expect(snapshot["item-a"]?.lastMovementAt).toBe(
      "2025-01-01T12:00:00.000+00:00"
    );
    expect(snapshot["item-b"]?.onHand).toBe(1);
    expect(snapshot["item-b"]?.lastMovementAt).toBe(
      "2025-01-01T09:00:00.000+00:00"
    );
  });
});