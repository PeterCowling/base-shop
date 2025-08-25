import { z } from "zod";
export declare const themeSettingsSchema: z.ZodObject<{
    template: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    theme: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    themeDefaults: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>>;
    themeOverrides: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>>;
}, "strict", z.ZodTypeAny, {
    template?: string | undefined;
    theme?: string | undefined;
    themeDefaults?: Record<string, string> | undefined;
    themeOverrides?: Record<string, string> | undefined;
}, {
    template?: string | undefined;
    theme?: string | undefined;
    themeDefaults?: Record<string, string> | undefined;
    themeOverrides?: Record<string, string> | undefined;
}>;
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;
