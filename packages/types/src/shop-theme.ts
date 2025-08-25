import { z } from "zod";

export const shopThemeSchema = z
  .object({
    themeId: z.string(),
    /** Mapping of design tokens to original theme values */
    themeDefaults: z.record(z.string()).default({}),
    /** Mapping of token overrides to theme values */
    themeOverrides: z.record(z.string()).default({}),
    /** Mapping of design tokens to theme values (defaults merged with overrides) */
    themeTokens: z.record(z.string()).default({}),
  })
  .strict();

export type ShopTheme = z.infer<typeof shopThemeSchema>;
