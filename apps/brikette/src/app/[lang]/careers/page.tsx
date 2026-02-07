// src/app/[lang]/careers/page.tsx
// Careers page - App Router version
import { Fragment } from "react";
import type { Metadata } from "next";

import { resolveI18nMetaForApp, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import CareersHero from "@/components/careers/CareersHero";
import CareersSection from "@/components/careers/CareersSection";
import CareersStructuredData from "@/components/seo/CareersStructuredData";
import { getSlug } from "@/utils/slug";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const meta = await resolveI18nMetaForApp(validLang, "careersPage");
  const localizedSlug = getSlug("careers", validLang);
  const path = `/${validLang}/${localizedSlug}`;

  return buildAppMetadata({
    lang: validLang,
    title: meta.title,
    description: meta.description,
    path,
  });
}

export default async function CareersPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return (
    <Fragment>
      <CareersStructuredData lang={validLang} />
      <CareersHero lang={validLang} />
      <CareersSection lang={validLang} />
    </Fragment>
  );
}
