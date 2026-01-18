import type { Locale } from "./constants";
export type LocalizedString = Readonly<Partial<Record<Locale, string>>>;
export type KeyRef = Readonly<{
    type: "key";
    key: string;
    params?: Record<string, unknown>;
}>;
export type Inline = Readonly<{
    type: "inline";
    value: LocalizedString;
}>;
export type TranslatableText = KeyRef | Inline | string;
//# sourceMappingURL=i18n.d.ts.map