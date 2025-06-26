// packages/i18n/src/locales.d.ts

import type { Locale } from "@types";
export declare const locales: readonly Locale[];
export type { Locale };
export declare function resolveLocale(value: string | undefined): Locale;
