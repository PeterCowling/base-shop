import { z } from "zod";

export declare const subscriptionPlanSchema: z.ZodObject<{
    id: z.ZodString;
    price: z.ZodNumber;
    itemsIncluded: z.ZodNumber;
    swapLimit: z.ZodNumber;
    shipmentsPerMonth: z.ZodNumber;
    prorateOnChange: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    id: string;
    price: number;
    itemsIncluded: number;
    swapLimit: number;
    shipmentsPerMonth: number;
    prorateOnChange: boolean;
}, {
    id: string;
    price: number;
    itemsIncluded: number;
    swapLimit: number;
    shipmentsPerMonth: number;
    prorateOnChange?: boolean | undefined;
}>;
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
//# sourceMappingURL=SubscriptionPlan.d.ts.map