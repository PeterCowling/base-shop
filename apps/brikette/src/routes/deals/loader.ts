import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { langFromRequest } from "@/utils/lang";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { preloadI18nNamespaces, preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import type { LoaderFunctionArgs } from "react-router-dom";

import {
  DEALS_NAMESPACE,
  OPTIONAL_NAMESPACES,
} from "./constants";
import { resolveMetaString } from "./fallback";

export interface DealsLoaderData {
  lang: AppLanguage;
  title: string;
  desc: string;
  generatedAt: number;
}

export async function loadDealsData(request: Request): Promise<DealsLoaderData> {
  const lang = langFromRequest(request);

  await preloadNamespacesWithFallback(lang, [DEALS_NAMESPACE]);
  await preloadI18nNamespaces(lang, OPTIONAL_NAMESPACES, { optional: true });

  await i18n.changeLanguage(lang);

  const meta = resolveI18nMeta(lang, DEALS_NAMESPACE);

  return {
    lang,
    title: resolveMetaString("meta.title", meta.title),
    desc: resolveMetaString("meta.description", meta.description),
    generatedAt: Date.now(),
  };
}

export async function clientLoader({ request }: LoaderFunctionArgs): Promise<DealsLoaderData> {
  return loadDealsData(request);
}
