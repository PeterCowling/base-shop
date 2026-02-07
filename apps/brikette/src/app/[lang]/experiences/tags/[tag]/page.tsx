// src/app/[lang]/experiences/tags/[tag]/page.tsx
// Guide tag page - App Router version
import type { Metadata } from "next";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { GUIDES_INDEX } from "@/data/guides.index";
import { TAGS_SUMMARY } from "@/data/tags.index";
import { getSlug } from "@/utils/slug";
import { getTagMeta } from "@/utils/tags";

import GuidesTagContent from "./GuidesTagContent";

type Props = {
  params: Promise<{ lang: string; tag: string }>;
};

export async function generateStaticParams() {
  const langParams = generateLangParams();
  // Get all unique tags from the guides index
  const allTags = new Set<string>();
  for (const guide of GUIDES_INDEX) {
    for (const tag of guide.tags) {
      allTags.add(tag);
    }
  }
  return langParams.flatMap(({ lang }) =>
    Array.from(allTags).map((tag) => ({ lang, tag: encodeURIComponent(tag) }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, tag: encodedTag } = await params;
  const validLang = toAppLanguage(lang);
  const tag = decodeURIComponent(encodedTag);

  const tagMeta = getTagMeta(validLang, tag);
  const title = tagMeta.title || tag || "Guides";
  const description = tagMeta.description || "";

  const experiencesSlug = getSlug("experiences", validLang);
  const tagsSlug = getSlug("guidesTags", validLang);
  const path = `/${validLang}/${experiencesSlug}/${tagsSlug}/${encodeURIComponent(tag)}`;

  // Don't index tag pages with fewer than 3 guides
  const itemCount = GUIDES_INDEX.filter((g) => g.tags.includes(tag)).length;
  const isPublished = itemCount >= 3;

  return buildAppMetadata({
    lang: validLang,
    title,
    description,
    path,
    isPublished,
  });
}

export default async function GuidesTagPage({ params }: Props) {
  const { lang, tag: encodedTag } = await params;
  const validLang = toAppLanguage(lang);
  const tag = decodeURIComponent(encodedTag);

  return <GuidesTagContent lang={validLang} tag={tag} />;
}
