// src/app/[lang]/private-rooms/street-level-arrival/page.tsx
// Street-level arrival page - App Router version
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { OG_IMAGE } from "@/utils/headConstants";

import StreetLevelArrivalContent from "./StreetLevelArrivalContent";

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

  const title = (t("streetLevelArrival.meta.title") as string) || "";
  const description = (t("streetLevelArrival.meta.description") as string) || "";

  const path = `/${validLang}/apartment/street-level-arrival`;

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

export default async function StreetLevelArrivalPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return <StreetLevelArrivalContent lang={validLang} />;
}
