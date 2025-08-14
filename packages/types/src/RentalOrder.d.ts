import { z } from "zod";
export declare const rentalOrderSchema: z.ZodObject<{
    id: z.ZodString;
    sessionId: z.ZodString;
    shop: z.ZodString;
    deposit: z.ZodNumber;
    expectedReturnDate: z.ZodOptional<z.ZodString>;
    /** Date by which the item must be returned */
    returnDueDate: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodString;
    returnedAt: z.ZodOptional<z.ZodString>;
    /** Timestamp when the returned item was received at the warehouse */
    returnReceivedAt: z.ZodOptional<z.ZodString>;
    refundedAt: z.ZodOptional<z.ZodString>;
    /** Optional damage fee deducted from the deposit */
    damageFee: z.ZodOptional<z.ZodNumber>;
    /** Amount charged as a late fee (in minor units) */
    lateFeeCharged: z.ZodOptional<z.ZodNumber>;
    customerId: z.ZodOptional<z.ZodString>;
    riskLevel: z.ZodOptional<z.ZodString>;
    riskScore: z.ZodOptional<z.ZodNumber>;
    flaggedForReview: z.ZodOptional<z.ZodBoolean>;
    trackingNumber: z.ZodOptional<z.ZodString>;
    labelUrl: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id?: string;
    deposit?: number;
    sessionId?: string;
    shop?: string;
    expectedReturnDate?: string;
    returnDueDate?: string;
    startedAt?: string;
    returnedAt?: string;
    returnReceivedAt?: string;
    refundedAt?: string;
    damageFee?: number;
    lateFeeCharged?: number;
    customerId?: string;
    riskLevel?: string;
    riskScore?: number;
    flaggedForReview?: boolean;
    trackingNumber?: string;
    labelUrl?: string;
}, {
    id?: string;
    deposit?: number;
    sessionId?: string;
    shop?: string;
    expectedReturnDate?: string;
    returnDueDate?: string;
    startedAt?: string;
    returnedAt?: string;
    returnReceivedAt?: string;
    refundedAt?: string;
    damageFee?: number;
    lateFeeCharged?: number;
    customerId?: string;
    riskLevel?: string;
    riskScore?: number;
    flaggedForReview?: boolean;
    trackingNumber?: string;
    labelUrl?: string;
}>;
export type RentalOrder = z.infer<typeof rentalOrderSchema>;
