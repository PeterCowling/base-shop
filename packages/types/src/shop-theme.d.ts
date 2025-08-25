import { z } from "zod";
export declare const shopThemeSchema: z.ZodObject<{
    themeId: z.ZodString;
    themeDefaults: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    themeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    themeTokens: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    themeId: string;
    themeDefaults: Record<string, string>;
    themeOverrides: Record<string, string>;
    themeTokens: Record<string, string>;
}, {
    themeId: string;
    themeDefaults?: Record<string, string> | undefined;
    themeOverrides?: Record<string, string> | undefined;
    themeTokens?: Record<string, string> | undefined;
}>;
export type ShopTheme = z.infer<typeof shopThemeSchema>;
