// src/app/[lang]/apartment/book/page.tsx
// Apartment booking page - App Router version
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import ApartmentBookContent from "./ApartmentBookContent";

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

  const title = (t("book.meta.title") as string) || "";
  const description = (t("book.meta.description") as string) || "";

  const apartmentSlug = getSlug("apartment", validLang);
  const path = `/${validLang}/${apartmentSlug}/book`;

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
  });
}

export default async function ApartmentBookPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return <ApartmentBookContent lang={validLang} />;
}
