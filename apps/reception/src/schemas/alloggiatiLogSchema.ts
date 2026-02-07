import { z } from "zod";

export const alloggiatiLogEntrySchema = z.object({
  result: z.string(),
  timestamp: z.string(),
  erroreCod: z.string().optional(),
  erroreDes: z.string().optional(),
  erroreDettaglio: z.string().optional(),
  occupantRecord: z.string().optional(),
  occupantRecordLength: z.number().optional(),
});

export const alloggiatiDateLogsSchema = z.record(alloggiatiLogEntrySchema);

export type AlloggiatiLogEntry = z.infer<typeof alloggiatiLogEntrySchema>;
export type AlloggiatiDateLogs = z.infer<typeof alloggiatiDateLogsSchema>;
