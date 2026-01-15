import { z } from "zod";

export const manualPmsPostingSchema = z.object({
  amount: z.number(),
  method: z.enum(["CASH", "CC"]),
  createdAt: z.string(),
  createdBy: z.string(),
  note: z.string().optional(),
});

export const manualTerminalBatchSchema = z.object({
  amount: z.number(),
  createdAt: z.string(),
  createdBy: z.string(),
  note: z.string().optional(),
});

export const manualPmsPostingsSchema = z.record(manualPmsPostingSchema);
export const manualTerminalBatchesSchema = z.record(manualTerminalBatchSchema);