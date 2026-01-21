import { z } from "zod";

export const terminalBatchSchema = z.object({
  amount: z.number(),
});

export const terminalBatchesSchema = z.array(terminalBatchSchema);

export type TerminalBatch = z.infer<typeof terminalBatchSchema>;
export type TerminalBatches = z.infer<typeof terminalBatchesSchema>;
