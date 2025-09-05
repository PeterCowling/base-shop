import { z } from "zod";

export const customerProfileSchema = z
  .object({
    customerId: z.string(),
    name: z.string(),
    email: z.string(),
  })
  .strict();

export type CustomerProfile = z.infer<typeof customerProfileSchema>;

