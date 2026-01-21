// src/app/[lang]/deals/page.tsx
// Deals page - App Router version
import type { Metadata } from "next";

import { getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import DealsPageContent from "./DealsPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["dealsPage"]);

  const title = (t("meta.title") as string) || "";
  const description = (t("meta.description") as string) || "";

  const dealsSlug = getSlug("deals", validLang);
  const path = `/${validLang}/${dealsSlug}`;

  const image = buildCfImageUrl("/img/og-deals.jpg", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  return buildAppMetadata({
    lang: validLang,
    title,
    description,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
}

export default async function DealsPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return <DealsPageContent lang={validLang} />;
}
