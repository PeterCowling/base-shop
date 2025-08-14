import { z } from "zod";
export declare const rentalOrderSchema: z.ZodObject<{
    id: z.ZodString;
    sessionId: z.ZodString;
    shop: z.ZodString;
    deposit: z.ZodNumber;
    expectedReturnDate: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodString;
    returnedAt: z.ZodOptional<z.ZodString>;
    refundedAt: z.ZodOptional<z.ZodString>;
    /** Optional damage fee deducted from the deposit */
    damageFee: z.ZodOptional<z.ZodNumber>;
    customerId: z.ZodOptional<z.ZodString>;
    riskLevel: z.ZodOptional<z.ZodString>;
    riskScore: z.ZodOptional<z.ZodNumber>;
    flaggedForReview: z.ZodOptional<z.ZodBoolean>;
    trackingNumber: z.ZodOptional<z.ZodString>;
    labelUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    deposit: number;
    sessionId: string;
    shop: string;
    startedAt: string;
    expectedReturnDate?: string | undefined;
    returnedAt?: string | undefined;
    refundedAt?: string | undefined;
    damageFee?: number | undefined;
    customerId?: string | undefined;
    riskLevel?: string | undefined;
    riskScore?: number | undefined;
    flaggedForReview?: boolean | undefined;
    trackingNumber?: string | undefined;
    labelUrl?: string | undefined;
}, {
    id: string;
    deposit: number;
    sessionId: string;
    shop: string;
    startedAt: string;
    expectedReturnDate?: string | undefined;
    returnedAt?: string | undefined;
    refundedAt?: string | undefined;
    damageFee?: number | undefined;
    customerId?: string | undefined;
    riskLevel?: string | undefined;
    riskScore?: number | undefined;
    flaggedForReview?: boolean | undefined;
    trackingNumber?: string | undefined;
    labelUrl?: string | undefined;
}>;
export type RentalOrder = z.infer<typeof rentalOrderSchema>;
//# sourceMappingURL=RentalOrder.d.ts.map