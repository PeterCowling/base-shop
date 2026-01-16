import { z } from "zod";

const positiveNumber = z.number().positive();
const nonNegativeInt = z.number().int().nonnegative();

/**
 * Generic schema for safe-related transactions.
 * Ensures amounts are positive and keycard fields are non-negative.
 */
export const safeTransactionFormSchema = z.object({
  amount: positiveNumber,
  keycards: nonNegativeInt.optional(),
  keycardDifference: z.number().int().optional(),
});

export type SafeTransactionForm = z.infer<typeof safeTransactionFormSchema>;
