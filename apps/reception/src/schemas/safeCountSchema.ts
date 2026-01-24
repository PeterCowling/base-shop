import { z } from "zod";

export const denomBreakdownSchema = z.record(z.number());

export const exchangeBreakdownSchema = z.object({
  incoming: denomBreakdownSchema,
  outgoing: denomBreakdownSchema,
});

export const safeCountSchema = z.object({
  user: z.string(),
  timestamp: z.string(),
  type: z.enum([
    "deposit",
    "withdrawal",
    "pettyWithdrawal",
    "exchange",
    "bankDeposit",
    "bankWithdrawal",
    "opening",
    "safeReset",
    "reconcile",
    "safeReconcile",
  ]),
  count: z.number().optional(),
  difference: z.number().optional(),
  keycardCount: z.number().optional(),
  keycardDifference: z.number().optional(),
  amount: z.number().optional(),
  direction: z.enum(["drawerToSafe", "safeToDrawer"]).optional(),
  denomBreakdown: z
    .union([denomBreakdownSchema, exchangeBreakdownSchema])
    .optional(),
  shiftId: z.string().optional(),
})
  .refine(
    (data) => data.amount === undefined || data.amount > 0,
    {
      path: ["amount"],
      message: "amount must be greater than 0",
    }
  )
  .superRefine((data, ctx) => {
  if (data.type === "exchange") {
    if (typeof data.amount !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "amount is required for exchange",
      });
    }
    if (!data.direction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["direction"],
        message: "direction is required for exchange",
      });
    }
  }
});

export const safeCountsSchema = z.record(safeCountSchema);

export type SafeCount = z.infer<typeof safeCountSchema>;
export type SafeCounts = z.infer<typeof safeCountsSchema>;
