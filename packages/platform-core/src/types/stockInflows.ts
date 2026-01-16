import { z } from "zod";

export const stockInflowItemSchema = z
  .object({
    sku: z.string().min(1),
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    variantAttributes: z.record(z.string()).optional(),
  })
  .strict();

export type StockInflowItem = z.infer<typeof stockInflowItemSchema>;

export const stockInflowRequestSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    items: z.array(stockInflowItemSchema).min(1),
    dryRun: z.boolean().optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

export type StockInflowRequest = z.infer<typeof stockInflowRequestSchema>;

export type StockInflowActor = {
  customerId?: string;
  role?: string;
};

export type StockInflowItemResult = {
  sku: string;
  productId: string;
  variantAttributes: Record<string, string>;
  delta: number;
  previousQuantity: number;
  nextQuantity: number;
};

export type StockInflowReport = {
  shop: string;
  idempotencyKey: string;
  dryRun: boolean;
  receivedAt: string;
  receivedBy?: StockInflowActor;
  note?: string;
  created: number;
  updated: number;
  items: StockInflowItemResult[];
};

export const stockInflowEventSchema = z
  .object({
    id: z.string().min(1),
    idempotencyKey: z.string().uuid(),
    shop: z.string().min(1),
    receivedAt: z.string().min(1),
    receivedBy: z
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
          quantity: z.number().int().positive(),
          variantAttributes: z.record(z.string()),
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
              delta: z.number().int().positive(),
              previousQuantity: z.number().int().nonnegative(),
              nextQuantity: z.number().int().nonnegative(),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

export type StockInflowEvent = z.infer<typeof stockInflowEventSchema>;

