import { z } from "zod";

export const shopThemeSchema = z
  .object({
    themeId: z.string(),
    themeDefaults: z.record(z.string()).default({}),
    themeOverrides: z.record(z.string()).default({}),
    themeTokens: z.record(z.string()).default({}),
  })
  .strict();

export type ShopTheme = z.infer<typeof shopThemeSchema>;
