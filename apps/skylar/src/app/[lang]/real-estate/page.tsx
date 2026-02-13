import type { Metadata } from "next";

import { getLocaleFromParams, type LangRouteParams, type Locale,LOCALES } from "@/lib/locales";
import { createTranslator, getMessages } from "@/lib/messages";
import { skylarMetadata } from "@/lib/seo";

import DefaultRealEstatePage from "./components/DefaultRealEstatePage";
import EnglishRealEstatePage from "./components/EnglishRealEstatePage";
import ZhRealEstatePage from "./components/ZhRealEstatePage";
import { HOSTEL_IMAGE_SOURCES, STEPFREE_IMAGE_SOURCES } from "./constants";
import { translateImageSources } from "./utils";

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
    title: t("realEstate.heading"),
    description: t("realEstate.intro"),
    path: "/real-estate",
  });
}

export default async function RealEstatePage({ params }: { params?: Promise<LangRouteParams> }) {
  const resolvedParams = params ? await params : undefined;
  const lang: Locale = getLocaleFromParams(resolvedParams);
  const messages = getMessages(lang);
  const translator = createTranslator(messages);
  const hostelImages = translateImageSources(HOSTEL_IMAGE_SOURCES, translator);
  const stepFreeImages = translateImageSources(STEPFREE_IMAGE_SOURCES, translator);

  if (lang === "en") {
    return (
      <EnglishRealEstatePage
        lang={lang}
        translator={translator}
        hostelImages={hostelImages}
        stepFreeImages={stepFreeImages}
      />
    );
  }

  if (lang === "zh") {
    return <ZhRealEstatePage lang={lang} translator={translator} />;
  }

  return (
    <DefaultRealEstatePage
      lang={lang}
      translator={translator}
      hostelImages={hostelImages}
      stepFreeImages={stepFreeImages}
    />
  );
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
