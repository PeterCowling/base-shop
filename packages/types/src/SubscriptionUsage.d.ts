import { z } from "zod";
export declare const subscriptionUsageSchema: z.ZodObject<{
    id: z.ZodString;
    shop: z.ZodString;
    customerId: z.ZodString;
    month: z.ZodString;
    shipments: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    id: string;
    shop: string;
    customerId: string;
    month: string;
    shipments: number;
}, {
    id: string;
    shop: string;
    customerId: string;
    month: string;
    shipments: number;
}>;
export type SubscriptionUsage = z.infer<typeof subscriptionUsageSchema>;

