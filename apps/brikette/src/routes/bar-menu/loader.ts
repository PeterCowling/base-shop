import type { LoaderFunctionArgs } from "react-router-dom";

import i18n from "@/i18n";
import { type AppLanguage } from "@/i18n.config";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { langFromRequest } from "@/utils/lang";
import { preloadI18nNamespaces, preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request) as AppLanguage;
  const ns = "barMenuPage";

  await preloadNamespacesWithFallback(lang, [ns]);
  await preloadI18nNamespaces(lang, ["menus"], { optional: true });

  await i18n.changeLanguage(lang);
  const meta = resolveI18nMeta(lang, ns);

  return {
    lang,
    title: meta.title,
    desc: meta.description,
  } as const;
}
