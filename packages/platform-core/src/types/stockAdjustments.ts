import { z } from "zod";

export const adjustmentReasonSchema = z.enum([
  "correction",
  "damage",
  "shrinkage",
  "return_to_stock",
  "manual_recount",
]);

export const stockAdjustmentItemSchema = z
  .object({
    sku: z.string().min(1),
    productId: z.string().min(1),
    quantity: z.number().int().refine((v) => v !== 0, "quantity must be non-zero"),
    variantAttributes: z.record(z.string()).optional(),
    reason: adjustmentReasonSchema,
  })
  .strict();

export type StockAdjustmentItem = z.infer<typeof stockAdjustmentItemSchema>;

export const stockAdjustmentRequestSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    items: z.array(stockAdjustmentItemSchema).min(1),
    dryRun: z.boolean().optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

export type StockAdjustmentRequest = z.infer<typeof stockAdjustmentRequestSchema>;

export type StockAdjustmentActor = {
  customerId?: string;
  role?: string;
};

export type StockAdjustmentItemResult = {
  sku: string;
  productId: string;
  variantAttributes: Record<string, string>;
  delta: number;
  previousQuantity: number;
  nextQuantity: number;
  reason: z.infer<typeof adjustmentReasonSchema>;
};

export type StockAdjustmentReport = {
  shop: string;
  idempotencyKey: string;
  dryRun: boolean;
  adjustedAt: string;
  adjustedBy?: StockAdjustmentActor;
  note?: string;
  created: number;
  updated: number;
  items: StockAdjustmentItemResult[];
};

export const stockAdjustmentEventSchema = z
  .object({
    id: z.string().min(1),
    idempotencyKey: z.string().uuid(),
    shop: z.string().min(1),
    adjustedAt: z.string().min(1),
    adjustedBy: z
      .object({
        customerId: z.string().optional(),
        role: z.string().optional(),
      })
      .optional(),
    note: z.string().optional(),
    items: z.array(
      z
        .object({
          sku: z.string().min(1),
          productId: z.string().min(1),
          quantity: z.number().int(),
          variantAttributes: z.record(z.string()),
          reason: adjustmentReasonSchema,
        })
        .strict(),
    ),
    report: z
      .object({
        created: z.number().int().nonnegative(),
        updated: z.number().int().nonnegative(),
        items: z.array(
          z
            .object({
              sku: z.string().min(1),
              productId: z.string().min(1),
              variantAttributes: z.record(z.string()),
              delta: z.number().int(),
              previousQuantity: z.number().int().nonnegative(),
              nextQuantity: z.number().int().nonnegative(),
              reason: adjustmentReasonSchema,
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

export type StockAdjustmentEvent = z.infer<typeof stockAdjustmentEventSchema>;
