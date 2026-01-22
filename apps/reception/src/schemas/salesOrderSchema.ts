import { z } from "zod";

export const salesOrderItemSchema = z.object({
  product: z.string(),
  price: z.number().optional(),
  count: z.number(),
  lineType: z.enum(["bds", "kds"]).optional(),
});

export const salesOrderSchema = z.object({
  orderKey: z.string(),
  confirmed: z.boolean(),
  bleepNumber: z.string(),
  userName: z.string(),
  time: z.string(),
  paymentMethod: z.string(),
  items: z.array(salesOrderItemSchema),
});

export type SalesOrderItem = z.infer<typeof salesOrderItemSchema>;
export type SalesOrder = z.infer<typeof salesOrderSchema>;
