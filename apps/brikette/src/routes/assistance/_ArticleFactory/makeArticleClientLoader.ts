// src/routes/assistance/_ArticleFactory/makeArticleClientLoader.ts
import type { LoaderFunctionArgs } from "react-router-dom";

import i18n from "@/i18n";
import { langFromRequest } from "@/utils/lang";
import { preloadI18nNamespaces } from "@/utils/loadI18nNs";

import { OPTIONAL_NAMESPACES } from "./constants";
import { resolveMeta } from "./metaUtils";
import type { AssistanceArticleLoaderData } from "./types";

export function makeArticleClientLoader(namespace: string) {
  return async function clientLoader({ request }: LoaderFunctionArgs): Promise<AssistanceArticleLoaderData> {
    const lang = langFromRequest(request);

    await preloadI18nNamespaces(lang, [namespace]);
    await preloadI18nNamespaces(lang, OPTIONAL_NAMESPACES, { optional: true });
    if (lang !== "en") {
      await preloadI18nNamespaces("en", [namespace], { optional: true });
    }

    await i18n.changeLanguage(lang);

    return {
      lang,
      title: resolveMeta(lang, namespace, "meta.title"),
      description: resolveMeta(lang, namespace, "meta.description"),
    };
  };
}

