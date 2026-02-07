// src/app/[lang]/assistance/[article]/page.tsx
// Assistance article page - renders guides from the assistance area
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { loadGuideI18nBundle } from "@/app/_lib/guide-i18n-bundle";
import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { GUIDES_INDEX, isGuidePublished } from "@/data/guides.index";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";
import { guideNamespace, guidePath, guideSlug, resolveGuideKeyFromSlug } from "@/routes.guides-helpers";
import { OG_IMAGE } from "@/utils/headConstants";

import GuideContent from "../../experiences/[slug]/GuideContent";

type Props = {
  params: Promise<{ lang: string; article: string }>;
};

export async function generateStaticParams() {
  const langParams = generateLangParams();
  return langParams.flatMap(({ lang }) => {
    const guideSlugs = GUIDES_INDEX.filter((guide) => guide.status === "published")
      .map((guide) => guide.key)
      .filter(
        (key) => guideNamespace(lang as Parameters<typeof guideNamespace>[0], key).baseKey === "assistance",
      )
      .map((key) => guideSlug(lang as Parameters<typeof guideSlug>[0], key));

    const slugs = Array.from(new Set(guideSlugs));
    return slugs.map((slug) => ({ lang, article: slug }));
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, article } = await params;
  const validLang = toAppLanguage(lang);
  const guideKey = resolveGuideKeyFromSlug(article, validLang);
  const guideBase = guideKey ? guideNamespace(validLang, guideKey) : null;

  if (!guideKey || guideBase?.baseKey !== "assistance") {
    return {};
  }

  const t = await getTranslations(validLang, ["guides"]);
  const pick = (value: unknown, key: string): string => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed || trimmed === key) return "";
    return trimmed;
  };

  const title =
    pick(t(`content.${guideKey}.seo.title`), `content.${guideKey}.seo.title`) ||
    pick(t(`meta.title`), "meta.title") ||
    "";
  const description =
    pick(t(`content.${guideKey}.seo.description`), `content.${guideKey}.seo.description`) ||
    pick(t(`meta.description`), "meta.description") ||
    "";

  const localizedSlug = guideSlug(validLang, guideKey);
  const path = `/${validLang}/${guideBase.baseSlug}/${localizedSlug}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  const isPublished = isGuidePublished(guideKey);

  return buildAppMetadata({
    lang: validLang,
    title,
    description,
    path,
    ogType: "article",
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    isPublished,
  });
}

export default async function AssistanceArticlePage({ params }: Props) {
  const { lang, article } = await params;
  const validLang = toAppLanguage(lang);
  const guideKey = resolveGuideKeyFromSlug(article, validLang);
  const guideBase = guideKey ? guideNamespace(validLang, guideKey) : null;

  if (!guideKey || !guideBase) notFound();
  if (!isGuidePublished(guideKey)) notFound();
  if (guideBase.baseKey !== "assistance") permanentRedirect(guidePath(validLang, guideKey));

  const { serverGuides, serverGuidesEn } = await loadGuideI18nBundle(validLang, guideKey);

  return (
    <GuideContent
      lang={validLang}
      guideKey={guideKey}
      serverGuides={serverGuides}
      serverGuidesEn={serverGuidesEn}
    />
  );
}
