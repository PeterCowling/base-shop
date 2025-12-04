import { z } from "zod";

export const providerSettingsSchema = z
  .object({
    payment: z.array(z.string()).default([]),
    billingProvider: z.string().optional().default(""),
    shipping: z.array(z.string()).default([]),
  })
  .strict();

export type ProviderSettings = z.infer<typeof providerSettingsSchema>;
