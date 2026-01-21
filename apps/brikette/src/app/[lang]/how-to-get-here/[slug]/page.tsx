// src/app/[lang]/how-to-get-here/[slug]/page.tsx
// How to get here dynamic route - App Router version
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { getRouteDefinition, listHowToSlugs } from "@/lib/how-to-get-here/definitions";
import type { RouteContentValue } from "@/lib/how-to-get-here/schema";
import { getContentForRoute } from "@/routes/how-to-get-here/content";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import HowToGetHereContent from "./HowToGetHereContent";

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
  return langParams.flatMap(({ lang }) =>
    slugs.map((slug) => ({ lang, slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);
  const definition = getRouteDefinition(slug);

  if (!definition) {
    return {};
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

export default async function HowToGetHerePage({ params }: Props) {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);
  const definition = getRouteDefinition(slug);

  if (!definition) {
    notFound();
  }

  const content = await getContentForRoute(validLang, definition.contentKey);
  const howToSlug = getSlug("howToGetHere", validLang);
  const guidesSlug = getSlug("guides", validLang);

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
