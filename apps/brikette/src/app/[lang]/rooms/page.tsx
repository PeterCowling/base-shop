// src/app/[lang]/rooms/page.tsx
// Rooms listing page - App Router version
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import RoomsPageContent from "./RoomsPageContent";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SearchParamsMap = Record<string, string | string[] | undefined>;

function readFirstSearchValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }
  return typeof value === "string" ? value : "";
}

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

export default async function RoomsPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const resolvedSearchParams: SearchParamsMap = await (searchParams ?? Promise.resolve({} as SearchParamsMap));

  await getTranslations(validLang, ["roomsPage"]);

  const queryString = new URLSearchParams(
    Object.entries(resolvedSearchParams).flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((entry) => [key, entry]);
      }
      if (typeof value === "string") {
        return [[key, value]];
      }
      return [];
    }),
  ).toString();

  return (
    <RoomsPageContent
      lang={validLang}
      bookingQuery={{
        checkIn: readFirstSearchValue(resolvedSearchParams.checkin),
        checkOut: readFirstSearchValue(resolvedSearchParams.checkout),
        pax: readFirstSearchValue(resolvedSearchParams.pax),
        queryString,
      }}
    />
  );
}
