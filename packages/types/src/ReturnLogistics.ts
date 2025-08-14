import { z } from "zod";

/**
 * Options controlling how rental items are returned.
 *
 * - `labelService` specifies the provider used to create return shipping labels.
 * - `inStore` toggles whether items can be dropped off in store.
 * - `dropOffProvider` names the third-party drop-off service, if any.
 * - `tracking` indicates whether return shipments include tracking numbers.
 * - `requireTags` marks whether original tags must remain attached.
 * - `allowWear` toggles whether worn items may be returned.
 */
export const returnLogisticsSchema = z
  .object({
    labelService: z.string(),
    inStore: z.boolean(),
    dropOffProvider: z.string().optional(),
    tracking: z.boolean().optional(),
    requireTags: z.boolean().default(false),
    allowWear: z.boolean().default(true),
  })
  .strict();

export type ReturnLogistics = z.infer<typeof returnLogisticsSchema>;
