import { z } from "zod";

export const inventoryLedgerEntrySchema = z.object({
  itemId: z.string(),
  type: z.enum([
    "opening",
    "receive",
    "adjust",
    "waste",
    "transfer",
    "sale",
    "count",
    "return",
  ]),
  quantity: z.number(),
  user: z.string(),
  timestamp: z.string(),
  unit: z.string().optional(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  shiftId: z.string().optional(),
  note: z.string().optional(),
});

export const inventoryLedgerSchema = z.record(inventoryLedgerEntrySchema);

export type InventoryLedgerEntry = z.infer<typeof inventoryLedgerEntrySchema>;
export type InventoryLedger = z.infer<typeof inventoryLedgerSchema>;