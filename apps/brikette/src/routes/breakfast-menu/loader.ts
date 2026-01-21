import type { LoaderFunctionArgs } from "react-router-dom";

import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import { type AppLanguage } from "@/i18n.config";
import { langFromRequest } from "@/utils/lang";
import { preloadI18nNamespaces } from "@/utils/loadI18nNs";
import { getSlug } from "@/utils/slug";

import { getBreakfastMenuStringValue } from "./strings";

export type BreakfastMenuLoaderData = {
  lang: AppLanguage;
  title: string;
  desc: string;
  path: string;
  url: string;
};

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request) as AppLanguage;
  const slug = getSlug("breakfastMenu", lang);
  const path = `/${lang}/${slug}`;
  const url = `${BASE_URL}${path}`;
  const ns = "breakfastMenuPage";
  await preloadI18nNamespaces(lang, [ns]);
  await preloadI18nNamespaces(lang, ["menus"], { optional: true });
  await i18n.changeLanguage(lang);
  const t = i18n.getFixedT(lang, ns);
  const translate = (key: string) => t(key) as string;
  return {
    lang,
    title: getBreakfastMenuStringValue(lang, "meta.title", translate),
    desc: getBreakfastMenuStringValue(lang, "meta.description", translate),
    path,
    url,
  } satisfies BreakfastMenuLoaderData;
}
