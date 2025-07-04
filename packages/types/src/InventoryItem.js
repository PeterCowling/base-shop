import { z } from "zod";
export const inventoryItemSchema = z.object({
    sku: z.string(),
    quantity: z.number(),
});
