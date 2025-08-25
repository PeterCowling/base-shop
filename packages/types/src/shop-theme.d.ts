import { z } from "zod";
export declare const shopThemeSchema: z.ZodObject<{
    themeId: z.ZodString;
    /** Mapping of design tokens to original theme values */
    themeDefaults: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    /** Mapping of token overrides to theme values */
    themeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    /** Mapping of design tokens to theme values (defaults merged with overrides) */
    themeTokens: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    themeDefaults: Record<string, string>;
    themeOverrides: Record<string, string>;
    themeTokens: Record<string, string>;
    themeId: string;
}, {
    themeDefaults: Record<string, string>;
    themeOverrides: Record<string, string>;
    themeTokens: Record<string, string>;
    themeId: string;
}>;
export type ShopTheme = z.infer<typeof shopThemeSchema>;
