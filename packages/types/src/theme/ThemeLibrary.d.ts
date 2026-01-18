import { z } from "zod";
export declare const themeLibrarySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    brandColor: z.ZodString;
    createdBy: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    themeDefaults: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    themeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    themeTokens: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    themeOverrides: Record<string, string>;
    id: string;
    themeDefaults: Record<string, string>;
    themeTokens: Record<string, string>;
    createdBy: string;
    brandColor: string;
    version: number;
}, {
    name: string;
    id: string;
    createdBy: string;
    brandColor: string;
    themeOverrides?: Record<string, string> | undefined;
    themeDefaults?: Record<string, string> | undefined;
    themeTokens?: Record<string, string> | undefined;
    version?: number | undefined;
}>;
export type ThemeLibraryEntry = z.infer<typeof themeLibrarySchema>;
//# sourceMappingURL=ThemeLibrary.d.ts.map