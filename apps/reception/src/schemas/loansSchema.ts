import { z } from "zod";

export const loanItemEnum = z.enum([
  "Umbrella",
  "Hairdryer",
  "Steamer",
  "Padlock",
  "Keycard",
  "No_card",
]);

export const depositTypeEnum = z.enum([
  "CASH",
  "PASSPORT",
  "LICENSE",
  "ID",
  "NO_CARD",
]);

export const txTypeEnum = z.enum(["Loan", "Refund", "No_Card"]);

export const loanTransactionSchema = z.object({
  count: z.number(),
  createdAt: z.string(),
  depositType: depositTypeEnum,
  deposit: z.number(),
  item: loanItemEnum,
  type: txTypeEnum,
});

export const occupantLoanDataSchema = z.object({
  txns: z.record(loanTransactionSchema),
});

export const loansSchema = z.record(z.record(occupantLoanDataSchema));

export type LoanTransaction = z.infer<typeof loanTransactionSchema>;
export type OccupantLoanData = z.infer<typeof occupantLoanDataSchema>;
export type Loans = z.infer<typeof loansSchema>;
export type LoanItem = z.infer<typeof loanItemEnum>;
export type LoanMethod = z.infer<typeof depositTypeEnum>;
export type TxType = z.infer<typeof txTypeEnum>;
