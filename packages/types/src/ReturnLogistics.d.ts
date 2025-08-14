import { z } from "zod";
/**
 * Options controlling how rental items are returned.
 *
 * - `labelService` specifies the provider used to create return shipping labels.
 * - `inStore` toggles whether items can be dropped off in store.
 * - `dropOffProvider` names the third-party drop-off service, if any.
 * - `tracking` indicates whether return shipments include tracking numbers.
 */
export declare const returnLogisticsSchema: z.ZodObject<{
    labelService: z.ZodString;
    inStore: z.ZodBoolean;
    dropOffProvider: z.ZodOptional<z.ZodString>;
    tracking: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    labelService: string;
    inStore: boolean;
    dropOffProvider?: string | undefined;
    tracking?: boolean | undefined;
}, {
    labelService: string;
    inStore: boolean;
    dropOffProvider?: string | undefined;
    tracking?: boolean | undefined;
}>;
export type ReturnLogistics = z.infer<typeof returnLogisticsSchema>;
//# sourceMappingURL=ReturnLogistics.d.ts.map
