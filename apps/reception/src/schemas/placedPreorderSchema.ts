import { z } from "zod";

import { salesOrderItemSchema } from "./salesOrderSchema";

export const placedPreorderSchema = z.object({
  preorderTime: z.string(),
  items: z.array(salesOrderItemSchema),
});

export type PlacedPreorder = z.infer<typeof placedPreorderSchema>;
