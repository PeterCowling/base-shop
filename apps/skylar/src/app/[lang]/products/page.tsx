import { getLocaleFromParams, type LangRouteParams, type Locale,LOCALES } from "@/lib/locales";
import { createTranslator, getMessages } from "@/lib/messages";

import { ChineseProductsPage } from "./components/ChineseProductsPage";
import { EnglishProductsPage } from "./components/EnglishProductsPage";
import { StandardProductsPage } from "./components/StandardProductsPage";

export default async function ProductsPage({ params }: { params?: Promise<LangRouteParams> }) {
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
