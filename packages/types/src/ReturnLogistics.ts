import { z } from "zod";

/**
 * Options controlling how rental items are returned.
 *
 * - `labelService` specifies the provider used to create return shipping labels.
 * - `inStore` toggles whether items can be dropped off in store.
 * - `dropOffProvider` names the third-party drop-off service, if any.
 * - `tracking` indicates whether return shipments include tracking numbers.
 */
export const returnLogisticsSchema = z
  .object({
    labelService: z.string(),
    inStore: z.boolean(),
    dropOffProvider: z.string().optional(),
    tracking: z.boolean().optional(),
  })
  .strict();

export type ReturnLogistics = z.infer<typeof returnLogisticsSchema>;
