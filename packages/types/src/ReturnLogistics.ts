import { z } from "zod";

/**
 * Options controlling how rental items are returned.
 *
 * - `labelService` specifies the provider used to create return shipping labels.
 * - `inStore` toggles whether items can be dropped off in store.
 * - `dropOffProvider` names the third-party drop-off service, if any.
 * - `tracking` indicates whether return shipments include tracking numbers.
 * - `bagType` describes the packaging customers should reuse when returning items.
 * - `returnCarrier` lists supported carriers for return shipments.
 * - `homePickupZipCodes` enumerates ZIP codes eligible for carrier pickup.
 * - `mobileApp` toggles access to the mobile return application.
 * - `requireTags` specifies if items must have all tags attached.
 * - `allowWear` indicates whether signs of wear are acceptable.
 */
export const returnLabelServiceSchema = z.enum(["ups"]);

export const returnCarrierSchema = z.enum(["ups"]);

export const returnBagTypeSchema = z.enum(["reusable", "single-use"]);

export const returnLogisticsSchema = z
  .object({
    labelService: returnLabelServiceSchema,
    inStore: z.boolean(),
    dropOffProvider: z.string().optional(),
    tracking: z.boolean().optional(),
    bagType: returnBagTypeSchema,
    returnCarrier: z.array(returnCarrierSchema),
    homePickupZipCodes: z.array(z.string()),
    mobileApp: z.boolean().optional(),
    requireTags: z.boolean(),
    allowWear: z.boolean(),
  })
  .strict();

export type ReturnLogistics = z.infer<typeof returnLogisticsSchema>;
export type ReturnLabelService = z.infer<typeof returnLabelServiceSchema>;
export type ReturnCarrier = z.infer<typeof returnCarrierSchema>;
export type ReturnBagType = z.infer<typeof returnBagTypeSchema>;
