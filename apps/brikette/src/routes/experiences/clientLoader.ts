/* src/routes/experiences/clientLoader.ts */
import type { LoaderFunctionArgs } from "react-router-dom";

import i18n from "@/i18n";
import { type AppLanguage } from "@/i18n.config";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

const EXPERIENCES_NAMESPACE = "experiencesPage" as const;

export async function experiencesClientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request) as AppLanguage;
  await preloadNamespacesWithFallback(lang, [EXPERIENCES_NAMESPACE, "guides"], {
    optional: true,
  });
  await i18n.changeLanguage(lang);
  const meta = resolveI18nMeta(lang, EXPERIENCES_NAMESPACE);

  return {
    lang,
    title: meta.title,
    desc: meta.description,
  } as const;
}
