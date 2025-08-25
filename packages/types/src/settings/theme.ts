import { z } from "zod";

export const themeSettingsSchema = z
  .object({
    template: z.string().optional().default(""),
    theme: z.string().optional().default(""),
    themeDefaults: z.record(z.string()).optional().default({}),
    themeOverrides: z.record(z.string()).optional().default({}),
  })
  .strict();

export type ThemeSettings = z.infer<typeof themeSettingsSchema>;
