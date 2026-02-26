// src/app/[lang]/rooms/page.tsx
// Rooms listing page - App Router version
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import RoomsStructuredDataRsc from "@/components/seo/RoomsStructuredDataRsc";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import RoomsPageContent from "./RoomsPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["roomsPage"]);

  const title = (t("meta.title") as string) || "";
  const description = (t("meta.description") as string) || "";

  const roomsSlug = getSlug("rooms", validLang);
  const path = `/${validLang}/${roomsSlug}`;

  const image = buildCfImageUrl("/img/og-rooms.jpg", {
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

export default async function RoomsPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  // Pre-warm i18n cache and resolve hero copy server-side so the H1 is
  // guaranteed to render with translated content in the initial SSR HTML.
  const t = await getTranslations(validLang, ["roomsPage", "_tokens"]);
  const serverTitle = (t("hero.heading") as string) || "Our rooms";
  const serverSubtitle = (t("hero.subheading") as string) || "";

  return (
    <>
      <RoomsStructuredDataRsc lang={validLang} />
      <RoomsPageContent lang={validLang} serverTitle={serverTitle} serverSubtitle={serverSubtitle} />
    </>
  );
}
