import { z } from "zod";
/**
 * Options controlling how rental items are returned.
 *
 * - `labelService` specifies the provider used to create return shipping labels.
 * - `inStore` toggles whether items can be dropped off in store.
 */
export declare const returnLogisticsSchema: z.ZodObject<{
    labelService: z.ZodString;
    inStore: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    labelService: string;
    inStore: boolean;
}, {
    labelService: string;
    inStore: boolean;
}>;
export type ReturnLogistics = z.infer<typeof returnLogisticsSchema>;
//# sourceMappingURL=ReturnLogistics.d.ts.map