import type { Locale } from "./locales.js";

export interface MultilingualField {
    field: "title" | "desc";
    locale: Locale;
}
export declare function parseMultilingualInput(name: string, locales: readonly Locale[]): MultilingualField | null;
export default function normalizeMultilingualInput(input: string | Record<string, unknown>, locales: readonly Locale[]): Partial<Record<Locale, string>>;
