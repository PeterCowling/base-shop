// src/app/[lang]/experiences/[slug]/page.tsx
// Guide page - App Router version (dynamic route for all guides)
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { loadGuideI18nBundle } from "@/app/_lib/guide-i18n-bundle";
import { getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { GUIDES_INDEX, isGuidePublished } from "@/data/guides.index";
import { guideNamespace,guidePath, guideSlug, resolveGuideKeyFromSlug } from "@/routes.guides-helpers";
import { OG_IMAGE } from "@/utils/headConstants";

import GuideContent from "./GuideContent";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateStaticParams() {
  const langParams = generateLangParams();
  const publishedGuideKeys = GUIDES_INDEX.filter((guide) => guide.status === "published").map(
    (guide) => guide.key,
  );
  // Generate params for all guide keys across all languages
  return langParams.flatMap(({ lang }) =>
    publishedGuideKeys
      .filter((key) => guideNamespace(lang as Parameters<typeof guideNamespace>[0], key).baseKey === "experiences")
      .map((key) => ({
        lang,
        slug: guideSlug(lang as Parameters<typeof guideSlug>[0], key),
      }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);
  const guideKey = resolveGuideKeyFromSlug(slug, validLang);

  if (!guideKey) {
    return {};
  }
  const base = guideNamespace(validLang, guideKey);
  if (base.baseKey !== "experiences") {
    return {};
  }

  // Get guide metadata from translations
  const t = await getTranslations(validLang, ["guides"]);

  const pick = (value: unknown, key: string): string => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed || trimmed === key) return "";
    return trimmed;
  };

  // Try to get title/description from content, then meta, then fallback
  const title =
    pick(t(`content.${guideKey}.seo.title`), `content.${guideKey}.seo.title`) ||
    pick(t(`meta.title`), "meta.title") ||
    "";
  const description =
    pick(t(`content.${guideKey}.seo.description`), `content.${guideKey}.seo.description`) ||
    pick(t(`meta.description`), "meta.description") ||
    "";

  const localizedSlug = guideSlug(validLang, guideKey);
  const path = `/${validLang}/${base.baseSlug}/${localizedSlug}`;

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

export default async function GuidePage({ params }: Props) {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);
  const guideKey = resolveGuideKeyFromSlug(slug, validLang);

  if (!guideKey) {
    notFound();
  }
  const base = guideNamespace(validLang, guideKey);
  if (base.baseKey !== "experiences") {
    notFound();
  }
  if (!isGuidePublished(guideKey)) {
    notFound();
  }
  const localizedSlug = guideSlug(validLang, guideKey);
  if (slug !== localizedSlug) {
    permanentRedirect(guidePath(validLang, guideKey));
  }

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
