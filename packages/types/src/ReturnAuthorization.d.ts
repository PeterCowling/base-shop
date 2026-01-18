import { z } from "zod";
/**
 * Represents a return authorization issued for an order.
 */
export declare const returnAuthorizationSchema: z.ZodObject<{
    raId: z.ZodString;
    orderId: z.ZodString;
    status: z.ZodString;
    inspectionNotes: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    status: string;
    raId: string;
    orderId: string;
    inspectionNotes?: string | undefined;
}, {
    status: string;
    raId: string;
    orderId: string;
    inspectionNotes?: string | undefined;
}>;
export type ReturnAuthorization = z.infer<typeof returnAuthorizationSchema>;
//# sourceMappingURL=ReturnAuthorization.d.ts.map