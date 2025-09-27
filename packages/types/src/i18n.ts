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

// Backwards-compat: allow plain string as legacy value
export type TranslatableText = KeyRef | Inline | string;

