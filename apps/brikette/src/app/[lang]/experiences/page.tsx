// src/app/[lang]/experiences/page.tsx
// Experiences listing page - App Router version
import type { Metadata } from "next";

import { getNamespaceBundles, getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import ExperiencesStructuredDataRsc from "@/components/seo/ExperiencesStructuredDataRsc";
import { type AppNamespaceBundles } from "@/utils/primeAppI18nBundles";
import { getSlug } from "@/utils/slug";

import ExperiencesPageContent from "./ExperiencesPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["experiencesPage"]);

  const title = (t("meta.title") as string) || "";
  const description = (t("meta.description") as string) || "";

  const experiencesSlug = getSlug("experiences", validLang);
  const path = `/${validLang}/${experiencesSlug}`;

  return buildAppMetadata({
    lang: validLang,
    title,
    description,
    path,
  });
}

export default async function ExperiencesPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const preloadedNamespaceBundles: AppNamespaceBundles = await getNamespaceBundles(validLang, [
    "experiencesPage",
    "guides",
    "guides.tags",
    "translation",
  ]);
  return (
    <>
      <ExperiencesStructuredDataRsc lang={validLang} />
      <ExperiencesPageContent
        lang={validLang}
        preloadedNamespaceBundles={preloadedNamespaceBundles}
      />
    </>
  );
}
