import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

type EnsureNamespacesOptions = {
  optional?: boolean;
};

export async function ensureTestNamespaces(
  lang: AppLanguage,
  namespaces: readonly string[],
  options: EnsureNamespacesOptions = {},
): Promise<void> {
  if (namespaces.length > 0) {
    await preloadNamespacesWithFallback(lang, namespaces, {
      optional: options.optional,
      fallbackOptional: options.optional,
    });
  }
  if (i18n.language !== lang) {
    await i18n.changeLanguage(lang);
  }
}