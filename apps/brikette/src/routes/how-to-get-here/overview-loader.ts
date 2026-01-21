import type { LoaderFunctionArgs } from "react-router-dom";

import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

import type { OverviewLoaderData } from "./types";

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = (langFromRequest(request) as AppLanguage) ?? (i18nConfig.fallbackLng as AppLanguage);

  await preloadNamespacesWithFallback(lang, ["howToGetHere"], {});
  if (typeof i18n.changeLanguage === "function") {
    await i18n.changeLanguage(lang);
  } else {
    (i18n as { language?: string }).language = lang;
  }

  const title = i18n.t?.("howToGetHere:meta.title", { defaultValue: "" });
  const description = i18n.t?.("howToGetHere:meta.description", { defaultValue: "" });

  return {
    lang,
    title: typeof title === "string" ? title : String(title ?? ""),
    desc: typeof description === "string" ? description : String(description ?? ""),
  } satisfies OverviewLoaderData;
}

