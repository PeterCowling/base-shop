import type { Locale } from "./locales";
export interface MultilingualField {
    field: "title" | "desc";
    locale: Locale;
}
export declare function parseMultilingualInput(name: string, locales: readonly Locale[]): MultilingualField | null;
//# sourceMappingURL=parseMultilingualInput.d.ts.map