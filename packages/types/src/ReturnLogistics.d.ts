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
export declare const returnLogisticsSchema: z.ZodObject<{
    labelService: z.ZodString;
    inStore: z.ZodBoolean;
    dropOffProvider: z.ZodOptional<z.ZodString>;
    tracking: z.ZodOptional<z.ZodBoolean>;
    bagType: z.ZodString;
    returnCarrier: z.ZodArray<z.ZodString, "many">;
    homePickupZipCodes: z.ZodArray<z.ZodString, "many">;
    mobileApp: z.ZodOptional<z.ZodBoolean>;
    requireTags: z.ZodBoolean;
    allowWear: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    labelService: string;
    inStore: boolean;
    dropOffProvider?: string | undefined;
    tracking?: boolean | undefined;
    bagType: string;
    returnCarrier: string[];
    homePickupZipCodes: string[];
    mobileApp?: boolean | undefined;
    requireTags: boolean;
    allowWear: boolean;
}, {
    labelService: string;
    inStore: boolean;
    dropOffProvider?: string | undefined;
    tracking?: boolean | undefined;
    bagType: string;
    returnCarrier: string[];
    homePickupZipCodes: string[];
    mobileApp?: boolean | undefined;
    requireTags: boolean;
    allowWear: boolean;
}>;
export type ReturnLogistics = z.infer<typeof returnLogisticsSchema>;
