// src/app/[lang]/experiences/page.tsx
// Experiences listing page - App Router version
import type { Metadata } from "next";

import { getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { getSlug } from "@/utils/slug";

import ExperiencesPageContent from "./ExperiencesPageContent";

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
  const t = await getTranslations(validLang, ["experiencesPage"]);

  const title = (t("meta.title") as string) || "";
  const description = (t("meta.description") as string) || "";

  const experiencesSlug = getSlug("experiences", validLang);
  const path = `/${validLang}/${experiencesSlug}`;

  return buildAppMetadata({
    lang: validLang,
    title,
    description,
    path,
  });
}

export default async function ExperiencesPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const resolvedSearchParams: SearchParamsMap = await (searchParams ?? Promise.resolve({} as SearchParamsMap));

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
    <ExperiencesPageContent
      lang={validLang}
      topicParam={readFirstSearchValue(resolvedSearchParams.topic)}
      tagParam={readFirstSearchValue(resolvedSearchParams.tag)}
      queryString={queryString}
    />
  );
}
