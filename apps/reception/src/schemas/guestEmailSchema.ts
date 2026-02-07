import { z } from "zod";

export const GuestEmailRecord = z
  .object({
    email: z.string().optional(),
  })
  .strict();

export type GuestEmailRecord = z.infer<typeof GuestEmailRecord>;
