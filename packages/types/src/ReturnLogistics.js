import { z } from "zod";
/**
 * Options controlling how rental items are returned.
 *
 * - `labelService` specifies the provider used to create return shipping labels.
 * - `inStore` toggles whether items can be dropped off in store.
 */
export const returnLogisticsSchema = z.object({
    labelService: z.string(),
    inStore: z.boolean(),
});
