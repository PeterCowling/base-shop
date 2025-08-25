import { z } from "zod";

export const providerSettingsSchema = z
  .object({
    payment: z.array(z.string()).default([]),
    shipping: z.array(z.string()).default([]),
  })
  .strict();

export type ProviderSettings = z.infer<typeof providerSettingsSchema>;
