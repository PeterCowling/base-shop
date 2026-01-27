// src/app/[lang]/how-to-get-here/[slug]/page.tsx
// How to get here dynamic route - App Router version
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTranslations,toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { GUIDES_INDEX } from "@/data/guides.index";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";
import { getRouteDefinition, listHowToSlugs } from "@/lib/how-to-get-here/definitions";
import type { RouteContentValue } from "@/lib/how-to-get-here/schema";
import { getContentForRoute } from "@/routes/how-to-get-here/content";
import { guideNamespace,guideSlug, resolveGuideKeyFromSlug } from "@/routes.guides-helpers";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import HowToGetHereContent from "./HowToGetHereContent";
import GuideContent from "../../experiences/[slug]/GuideContent";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

function isRouteContentObject(value: RouteContentValue | undefined): value is Record<string, RouteContentValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveContentString(value: RouteContentValue | undefined): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (value && typeof value === "object" && !Array.isArray(value) && "linkLabel" in value) {
    const linked = value as { before?: string; linkLabel?: string; after?: string };
    const combined = [linked.before, linked.linkLabel, linked.after]
      .filter((segment): segment is string => typeof segment === "string" && segment.trim().length > 0)
      .join(" ")
      .trim();
    return combined.length > 0 ? combined : undefined;
  }
  return undefined;
}

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
  const definition = getRouteDefinition(slug);

  if (!definition) {
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

    const guideMeta = GUIDES_INDEX.find((g) => g.key === guideKey);
    const isPublished = (guideMeta?.status ?? "published") === "published";

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

  const content = await getContentForRoute(validLang, definition.contentKey);
  const contentRecord = content as Record<string, RouteContentValue>;
  const metaValue = contentRecord["meta"];
  const metaObject: Record<string, RouteContentValue> | undefined = isRouteContentObject(metaValue)
    ? (metaValue as Record<string, RouteContentValue>)
    : undefined;

  const title = resolveContentString(metaObject?.["title"]) ?? "";
  const description = resolveContentString(metaObject?.["description"]) ?? "";

  const howToSlug = getSlug("howToGetHere", validLang);
  const path = `/${validLang}/${howToSlug}/${slug}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  const isPublished = (definition.status ?? "published") === "published";

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

// Allowlist of migrated transport routes that should render via guide system
const MIGRATED_ROUTE_SLUGS = new Set<string>([
  "amalfi-positano-bus",
  "amalfi-positano-ferry",
  "naples-airport-positano-bus",
  "naples-center-train-bus",
  "positano-amalfi-bus",
]);

export default async function HowToGetHerePage({ params }: Props) {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);

  // Check migration allowlist first
  if (MIGRATED_ROUTE_SLUGS.has(slug)) {
    const guideKey = resolveGuideKeyFromSlug(slug, validLang);
    const guideBase = guideKey ? guideNamespace(validLang, guideKey) : null;
    if (guideKey && guideBase?.baseKey === "howToGetHere") {
      return <GuideContent lang={validLang} guideKey={guideKey} />;
    }
  }

  const definition = getRouteDefinition(slug);

  if (!definition) {
    const guideKey = resolveGuideKeyFromSlug(slug, validLang);
    const guideBase = guideKey ? guideNamespace(validLang, guideKey) : null;
    if (!guideKey || guideBase?.baseKey !== "howToGetHere") {
      notFound();
    }
    return <GuideContent lang={validLang} guideKey={guideKey} />;
  }

  const content = await getContentForRoute(validLang, definition.contentKey);
  const howToSlug = getSlug("howToGetHere", validLang);
  const guidesSlug = getSlug("experiences", validLang);

  // Determine if Chiesa Nuova details should be shown
  const CHIESA_NUOVA_BUS_SLUGS = new Set<string>([
    "amalfi-positano-bus",
    "naples-airport-positano-bus",
    "naples-center-train-bus",
    "ravello-positano-bus",
    "salerno-positano-bus",
    "sorrento-positano-bus",
  ]);
  const showChiesaNuovaDetails = CHIESA_NUOVA_BUS_SLUGS.has(slug);

  return (
    <HowToGetHereContent
      lang={validLang}
      slug={slug}
      definition={definition}
      content={content}
      howToSlug={howToSlug}
      guidesSlug={guidesSlug}
      showChiesaNuovaDetails={showChiesaNuovaDetails}
    />
  );
}
