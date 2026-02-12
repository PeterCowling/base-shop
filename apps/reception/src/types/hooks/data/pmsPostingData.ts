import { z } from "zod";

export const pmsPostingSchema = z.object({
  amount: z.number(),
  method: z.enum(["CASH", "CC"]),
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  note: z.string().optional(),
});

export const pmsPostingsSchema = z.record(pmsPostingSchema);

export type PmsPosting = z.infer<typeof pmsPostingSchema>;
export type PmsPostings = z.infer<typeof pmsPostingsSchema>;
