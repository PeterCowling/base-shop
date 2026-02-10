// src/app/[lang]/how-to-get-here/page.tsx
// How to get here index page - App Router version
import type { Metadata } from "next";

import { getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { getSlug } from "@/utils/slug";

import HowToGetHereIndexContent from "./HowToGetHereIndexContent";

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

export default async function HowToGetHereIndexPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const resolvedSearchParams: SearchParamsMap = await (searchParams ?? Promise.resolve({} as SearchParamsMap));
  const howToSlug = getSlug("howToGetHere", validLang);
  const basePath = `/${validLang}/${howToSlug}`;

  return (
    <HowToGetHereIndexContent
      lang={validLang}
      basePath={basePath}
      initialFilters={{
        transport: readFirstSearchValue(resolvedSearchParams.mode) || null,
        direction: readFirstSearchValue(resolvedSearchParams.direction) || null,
        destination: readFirstSearchValue(resolvedSearchParams.place) || null,
      }}
    />
  );
}
