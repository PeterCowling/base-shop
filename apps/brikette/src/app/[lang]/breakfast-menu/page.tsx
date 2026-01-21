// src/app/[lang]/breakfast-menu/page.tsx
// Breakfast Menu page - App Router version
// Note: Uses client component for menu content due to useTranslation hook
import type { Metadata } from "next";

import { resolveI18nMetaForApp, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { getSlug } from "@/utils/slug";

import { BreakfastMenuContent } from "./BreakfastMenuContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const meta = await resolveI18nMetaForApp(validLang, "breakfastMenuPage");
  const localizedSlug = getSlug("breakfastMenu", validLang);
  const path = `/${validLang}/${localizedSlug}`;

  return buildAppMetadata({
    lang: validLang,
    title: meta.title,
    description: meta.description,
    path,
  });
}

export default async function BreakfastMenuPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return <BreakfastMenuContent lang={validLang} />;
}
