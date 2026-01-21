import { loadMessages } from "./loadMessages.server.js";
import type { Locale } from "./locales.js";

/**
 * Load translation messages for a given locale on the server and return a
 * lookup function that supports simple template variable interpolation
 * using `{var}` placeholders.
 */
export async function useTranslations(
  locale: Locale,
): Promise<(key: string, vars?: Record<string, unknown>) => string> {
  const messages = await loadMessages(locale);
  return (key: string, vars?: Record<string, unknown>): string => {
    const msg = messages[key] ?? key;
    if (!vars) return msg;
    return msg.replace(/\{(.*?)\}/g, (match, name) => {
      return Object.prototype.hasOwnProperty.call(vars, name)
        ? String(vars[name])
        : match;
    });
  };
}
