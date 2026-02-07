// src/app/[lang]/how-to-get-here/[slug]/page.tsx
// How to get here dynamic route - App Router version (guide system only)
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { loadGuideI18nBundle } from "@/app/_lib/guide-i18n-bundle";
import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { GUIDES_INDEX, isGuidePublished } from "@/data/guides.index";
import { listHowToSlugs } from "@/lib/how-to-get-here/definitions";
import { guideNamespace, guideSlug, resolveGuideKeyFromSlug } from "@/routes.guides-helpers";
import { loadGuideManifestOverridesFromFs } from "@/routes/guides/guide-manifest-overrides.node";
import { OG_IMAGE } from "@/utils/headConstants";

import GuideContent from "../../experiences/[slug]/GuideContent";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateStaticParams() {
  const langParams = generateLangParams();
  const slugs = listHowToSlugs();
  return langParams.flatMap(({ lang }) => {
    const routeSlugs = slugs;
    const guideSlugs = GUIDES_INDEX.filter((guide) => guide.status === "published")
      .map((guide) => guide.key)
      .filter(
        (key) => guideNamespace(lang as Parameters<typeof guideNamespace>[0], key).baseKey === "howToGetHere",
      )
      .map((key) => guideSlug(lang as Parameters<typeof guideSlug>[0], key))
      .filter((slug) => !routeSlugs.includes(slug));

    const merged = Array.from(new Set([...routeSlugs, ...guideSlugs]));
    return merged.map((slug) => ({ lang, slug }));
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);

  // All transport routes now use the guide system
  const guideKey = resolveGuideKeyFromSlug(slug, validLang);
  const guideBase = guideKey ? guideNamespace(validLang, guideKey) : null;

  if (!guideKey || guideBase?.baseKey !== "howToGetHere") {
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

export default async function HowToGetHerePage({ params }: Props) {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);

  // All transport routes now use the guide system
  const guideKey = resolveGuideKeyFromSlug(slug, validLang);
  const guideBase = guideKey ? guideNamespace(validLang, guideKey) : null;

  if (!guideKey || guideBase?.baseKey !== "howToGetHere") {
    notFound();
  }
  if (!isGuidePublished(guideKey)) {
    notFound();
  }

  // Load manifest overrides (includes audit results)
  const serverOverrides = loadGuideManifestOverridesFromFs();

  const { serverGuides, serverGuidesEn } = await loadGuideI18nBundle(validLang, guideKey);

  return (
    <GuideContent
      lang={validLang}
      guideKey={guideKey}
      serverOverrides={serverOverrides}
      serverGuides={serverGuides}
      serverGuidesEn={serverGuidesEn}
    />
  );
}
