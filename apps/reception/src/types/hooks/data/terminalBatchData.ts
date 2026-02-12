import { z } from "zod";

export const terminalBatchSchema = z.object({
  amount: z.number(),
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  note: z.string().optional(),
});

export const terminalBatchesSchema = z.record(terminalBatchSchema);

export type TerminalBatch = z.infer<typeof terminalBatchSchema>;
export type TerminalBatches = z.infer<typeof terminalBatchesSchema>;
