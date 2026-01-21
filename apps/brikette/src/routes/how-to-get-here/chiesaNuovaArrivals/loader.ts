import type { LoaderFunctionArgs } from "react-router-dom";

import appI18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

import { GUIDE_KEY, REQUIRED_NAMESPACES } from "./constants";

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = (langFromRequest(request) as AppLanguage) ?? (i18nConfig.fallbackLng as AppLanguage);

  await preloadNamespacesWithFallback(lang, REQUIRED_NAMESPACES);

  // Dev-hardening: ensure the how-to guide content exists in the guides namespace
  // so article lead and labels don't render raw i18n keys if the split bundle
  // hasn't hydrated yet in the client. Remove once hydration is stable.
  await ensureGuideContent(lang, GUIDE_KEY, {
    en: () => import(`@/locales/en/guides/content/${GUIDE_KEY}.json`),
    ...(lang === "en"
      ? {}
      : {
          local: () =>
            import(`@/locales/${lang}/guides/content/${GUIDE_KEY}.json`).catch(() => undefined),
        }),
  });

  if (typeof appI18n.changeLanguage === "function") {
    await appI18n.changeLanguage(lang);
  } else {
    (appI18n as { language?: string }).language = lang;
  }

  return { lang, guide: GUIDE_KEY } as const;
}
