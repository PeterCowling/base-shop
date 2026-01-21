import { z } from "zod";

export declare const shopThemeSchema: z.ZodObject<{
    themeId: z.ZodString;
    themeDefaults: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    themeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    themeTokens: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    themeOverrides: Record<string, string>;
    themeId: string;
    themeDefaults: Record<string, string>;
    themeTokens: Record<string, string>;
}, {
    themeId: string;
    themeOverrides?: Record<string, string> | undefined;
    themeDefaults?: Record<string, string> | undefined;
    themeTokens?: Record<string, string> | undefined;
}>;
export type ShopTheme = z.infer<typeof shopThemeSchema>;
//# sourceMappingURL=shop-theme.d.ts.map