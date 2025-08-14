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
export declare const returnLabelServiceSchema: z.ZodEnum<["ups"]>;
export declare const returnCarrierSchema: z.ZodEnum<["ups"]>;
export declare const returnBagTypeSchema: z.ZodEnum<["reusable", "single-use"]>;
export declare const returnLogisticsSchema: z.ZodObject<{
    labelService: z.ZodEnum<["ups"]>;
    inStore: z.ZodBoolean;
    dropOffProvider: z.ZodOptional<z.ZodString>;
    tracking: z.ZodOptional<z.ZodBoolean>;
    bagType: z.ZodEnum<["reusable", "single-use"]>;
    returnCarrier: z.ZodArray<z.ZodEnum<["ups"]>, "many">;
    homePickupZipCodes: z.ZodArray<z.ZodString, "many">;
    mobileApp: z.ZodOptional<z.ZodBoolean>;
    requireTags: z.ZodBoolean;
    allowWear: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    labelService: "ups";
    inStore: boolean;
    dropOffProvider?: string | undefined;
    tracking?: boolean | undefined;
    bagType: "reusable" | "single-use";
    returnCarrier: ("ups")[];
    homePickupZipCodes: string[];
    mobileApp?: boolean | undefined;
    requireTags: boolean;
    allowWear: boolean;
}, {
    labelService: "ups";
    inStore: boolean;
    dropOffProvider?: string | undefined;
    tracking?: boolean | undefined;
    bagType: "reusable" | "single-use";
    returnCarrier: ("ups")[];
    homePickupZipCodes: string[];
    mobileApp?: boolean | undefined;
    requireTags: boolean;
    allowWear: boolean;
}>;
export type ReturnLogistics = z.infer<typeof returnLogisticsSchema>;
export type ReturnLabelService = z.infer<typeof returnLabelServiceSchema>;
export type ReturnCarrier = z.infer<typeof returnCarrierSchema>;
export type ReturnBagType = z.infer<typeof returnBagTypeSchema>;

