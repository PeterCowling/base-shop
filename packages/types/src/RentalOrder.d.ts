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
}, "strip", z.ZodTypeAny, {
    id?: string;
    deposit?: number;
    sessionId?: string;
    shop?: string;
    expectedReturnDate?: string;
    startedAt?: string;
    returnedAt?: string;
    refundedAt?: string;
}, {
    id?: string;
    deposit?: number;
    sessionId?: string;
    shop?: string;
    expectedReturnDate?: string;
    startedAt?: string;
    returnedAt?: string;
    refundedAt?: string;
}>;
export type RentalOrder = z.infer<typeof rentalOrderSchema>;
