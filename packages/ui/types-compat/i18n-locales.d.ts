export type Locale = string;
export const locales: readonly Locale[];
export const LOCALES: readonly Locale[];
export const resolveLocale: (value: string) => Locale;
