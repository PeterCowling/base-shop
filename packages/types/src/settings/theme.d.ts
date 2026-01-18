import { z } from "zod";
export declare const themeSettingsSchema: z.ZodObject<{
    template: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    theme: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    themeDefaults: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>;
    themeOverrides: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>;
}, "strict", z.ZodTypeAny, {
    theme: string;
    themeOverrides: Record<string, string>;
    template: string;
    themeDefaults: Record<string, string>;
}, {
    theme?: string | undefined;
    themeOverrides?: Record<string, string> | undefined;
    template?: string | undefined;
    themeDefaults?: Record<string, string> | undefined;
}>;
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;
//# sourceMappingURL=theme.d.ts.map