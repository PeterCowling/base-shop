// src/types/hooks/data/inventoryLedgerData.ts

export type InventoryLedgerEntryType =
  | "opening"
  | "receive"
  | "adjust"
  | "waste"
  | "transfer"
  | "sale"
  | "count"
  | "return";

export interface InventoryLedgerEntry {
  id?: string;
  itemId: string;
  type: InventoryLedgerEntryType;
  quantity: number;
  user: string;
  timestamp: string;
  unit?: string;
  reason?: string;
  reference?: string;
  shiftId?: string;
  note?: string;
}

export type InventoryLedger = Record<string, InventoryLedgerEntry> | null;