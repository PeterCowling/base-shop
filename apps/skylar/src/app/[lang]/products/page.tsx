import type { Metadata } from "next";

import { getLocaleFromParams, type LangRouteParams, type Locale,LOCALES } from "@/lib/locales";
import { createTranslator, getMessages } from "@/lib/messages";
import { skylarMetadata } from "@/lib/seo";

import { ChineseProductsPage } from "./components/ChineseProductsPage";
import { EnglishProductsPage } from "./components/EnglishProductsPage";
import { StandardProductsPage } from "./components/StandardProductsPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<LangRouteParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = getLocaleFromParams(resolvedParams);
  const messages = getMessages(lang);
  const t = createTranslator(messages);
  return skylarMetadata({
    locale: lang,
    title: t("products.heading"),
    description: t("products.intro"),
    path: "/products",
  });
}

export default async function ProductsPage(props: { params?: Promise<LangRouteParams> }) {
  const params = await props.params;
  const resolvedParams = params ? await params : undefined;
  const lang: Locale = getLocaleFromParams(resolvedParams);
  const messages = getMessages(lang);
  const translator = createTranslator(messages);
  if (lang === "en") {
    return <EnglishProductsPage lang={lang} translator={translator} />;
  }

  if (lang === "zh") {
    return <ChineseProductsPage lang={lang} translator={translator} />;
  }

  return <StandardProductsPage lang={lang} translator={translator} />;
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
