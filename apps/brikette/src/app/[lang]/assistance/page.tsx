// src/app/[lang]/assistance/page.tsx
// Assistance landing page - App Router version
import type { Metadata } from "next";

import { getTranslations, resolveI18nMetaForApp, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import AssistanceIndexContent from "./AssistanceIndexContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const meta = await resolveI18nMetaForApp(validLang, "assistanceSection");

  const assistanceSlug = getSlug("assistance", validLang);
  const path = `/${validLang}/${assistanceSlug}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  return buildAppMetadata({
    lang: validLang,
    title: meta.title,
    description: meta.description,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
}

export default async function AssistancePage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  await getTranslations(validLang, ["assistanceSection", "assistance", "guides", "howToGetHere"]);
  return <AssistanceIndexContent lang={validLang} />;
}
