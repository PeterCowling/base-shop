import { z } from "zod";

export const pmsPostingSchema = z.object({
  amount: z.number(),
  method: z.enum(["CASH", "CC"]),
});

export const pmsPostingsSchema = z.array(pmsPostingSchema);

export type PmsPosting = z.infer<typeof pmsPostingSchema>;
export type PmsPostings = z.infer<typeof pmsPostingsSchema>;
