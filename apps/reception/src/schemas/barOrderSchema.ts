import { z } from "zod";

import { salesOrderItemSchema } from "./salesOrderSchema";

export const barOrderSchema = z.object({
  confirmed: z.boolean(),
  items: z.array(salesOrderItemSchema),
});

export type BarOrder = z.infer<typeof barOrderSchema>;
