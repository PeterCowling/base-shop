import type { Locale } from "@platform-core/src/products";
export interface MultilingualField {
    field: "title" | "desc";
    locale: Locale;
}
export declare function parseMultilingualInput(name: string, locales: readonly Locale[]): MultilingualField | null;
//# sourceMappingURL=multilingual.d.ts.map