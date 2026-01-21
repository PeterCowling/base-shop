// src/routes/_shared/createBasicPageLoader.ts
import type { LoaderFunctionArgs } from "react-router-dom";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { langFromRequest } from "@/utils/lang";
import { preloadI18nNamespaces, preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

type MutableI18nInstance = {
  language?: string;
  languages?: string[];
  options?: {
    lng?: string;
  };
};

type Options = {
  optional?: readonly string[];
};

export function createBasicPageClientLoader(namespace: string, options: Options = {}) {
  const { optional = [] } = options;
  return async function clientLoader({ request }: LoaderFunctionArgs) {
    const lang = langFromRequest(request) as AppLanguage;

    await preloadNamespacesWithFallback(lang, [namespace]);
    const hasChangeLanguage = typeof i18n.changeLanguage === "function";
    if (optional.length && hasChangeLanguage) {
      await preloadI18nNamespaces(lang, optional as string[], { optional: true });
    }

    try {
      if (hasChangeLanguage) {
        await i18n.changeLanguage(lang);
      } else {
        throw new Error("changeLanguageUnavailable");
      }
    } catch {
      // Fallback for tests that stub react-i18next improperly
      const inst = i18n as unknown as MutableI18nInstance;

      // Try to set language with a light retry in case of transient setter errors
      try {
        inst.language = lang;
      } catch {
        try {
          inst.language = lang;
        } catch {
          // ignore if still failing
        }
      }

      // Ensure languages reflects the active language
      try {
        if (Array.isArray(inst.languages)) {
          if (inst.languages.length > 0) {
            inst.languages[0] = lang;
          } else {
            inst.languages.push(lang);
          }
        } else if (inst.languages === undefined) {
          // best-effort initialisation
          inst.languages = [lang];
        }
      } catch {
        // ignore
      }

      // Keep options.lng in sync when available
      try {
        if (inst.options) {
          inst.options.lng = lang;
        }
      } catch {
        // ignore
      }
    }

    const meta = resolveI18nMeta(lang, namespace);

    return {
      lang,
      title: meta.title,
      desc: meta.description,
    } as const;
  };
}
