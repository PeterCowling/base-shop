import { z } from "zod";
export declare const customerProfileSchema: z.ZodObject<{
    customerId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
}, "strict", z.ZodTypeAny, {
    customerId: string;
    name: string;
    email: string;
}, {
    customerId: string;
    name: string;
    email: string;
}>;
export type CustomerProfile = z.infer<typeof customerProfileSchema>;

