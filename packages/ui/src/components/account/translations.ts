import type { Locale } from "@acme/i18n/locales";
import type { TranslatableText } from "@acme/types/i18n";

type TranslateFn = (key: string, vars?: Record<string, unknown>) => string;

export function resolveTranslatableText(
  t: TranslateFn,
  text: TranslatableText | undefined,
  fallbackKey: string,
  locale: Locale,
): string {
  if (!text) return t(fallbackKey);
  if (typeof text === "string") return text;
  if (text.type === "key") return t(text.key);
  const inline = text.value?.[locale];
  return typeof inline === "string" ? inline : t(fallbackKey);
}
