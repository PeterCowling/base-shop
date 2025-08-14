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
export declare const returnLogisticsSchema: z.ZodObject<{
    labelService: z.ZodString;
    inStore: z.ZodBoolean;
    dropOffProvider: z.ZodOptional<z.ZodString>;
    tracking: z.ZodOptional<z.ZodBoolean>;
    requireTags: z.ZodDefault<z.ZodBoolean>;
    allowWear: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    labelService: string;
    inStore: boolean;
    dropOffProvider?: string | undefined;
    tracking?: boolean | undefined;
    requireTags: boolean;
    allowWear: boolean;
}, {
    labelService: string;
    inStore: boolean;
    dropOffProvider?: string | undefined;
    tracking?: boolean | undefined;
    requireTags?: boolean | undefined;
    allowWear?: boolean | undefined;
}>;
export type ReturnLogistics = z.infer<typeof returnLogisticsSchema>;
//# sourceMappingURL=ReturnLogistics.d.ts.map
