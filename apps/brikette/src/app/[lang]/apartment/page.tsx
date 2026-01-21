// src/app/[lang]/apartment/page.tsx
// Apartment page - App Router version
import type { Metadata } from "next";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import ApartmentPageContent from "./ApartmentPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["apartmentPage"]);

  const title = (t("meta.title") as string) || "";
  const description = (t("meta.description") as string) || "";
  const imageAlt = (t("heroImageAlt") as string) || "";

  const apartmentSlug = getSlug("apartment", validLang);
  const path = `/${validLang}/${apartmentSlug}`;

  const image = buildCfImageUrl("/img/facade.avif", {
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
    imageAlt,
  });
}

export default async function ApartmentPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return <ApartmentPageContent lang={validLang} />;
}
