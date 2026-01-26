// src/app/[lang]/how-to-get-here/page.tsx
// How to get here index page - App Router version
import { Suspense } from "react";
import type { Metadata } from "next";

import { getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { getSlug } from "@/utils/slug";

import HowToGetHereIndexContent from "./HowToGetHereIndexContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["howToGetHere"]);

  const title = (t("meta.title") as string) || "";
  const description = (t("meta.description") as string) || "";

  const howToSlug = getSlug("howToGetHere", validLang);
  const path = `/${validLang}/${howToSlug}`;

  return buildAppMetadata({
    lang: validLang,
    title,
    description,
    path,
  });
}

export default async function HowToGetHereIndexPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return (
    <Suspense fallback={<div />}>
      <HowToGetHereIndexContent lang={validLang} />
    </Suspense>
  );
}
