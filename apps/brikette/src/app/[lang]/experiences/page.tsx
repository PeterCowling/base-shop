// src/app/[lang]/experiences/page.tsx
// Experiences listing page - App Router version
import { Suspense } from "react";
import type { Metadata } from "next";

import { getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
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

  return (
    <Suspense fallback={null}>
      <ExperiencesPageContent lang={validLang} />
    </Suspense>
  );
}
