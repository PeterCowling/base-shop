// src/app/[lang]/bar-menu/page.tsx
// Bar Menu page - App Router version
// Note: Uses client component for menu content due to useTranslation hook
import type { Metadata } from "next";

import { resolveI18nMetaForApp, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { getSlug } from "@/utils/slug";

import { BarMenuContent } from "./BarMenuContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const meta = await resolveI18nMetaForApp(validLang, "barMenuPage");
  const localizedSlug = getSlug("barMenu", validLang);
  const path = `/${validLang}/${localizedSlug}`;

  return buildAppMetadata({
    lang: validLang,
    title: meta.title,
    description: meta.description,
    path,
  });
}

export default async function BarMenuPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return <BarMenuContent lang={validLang} />;
}
