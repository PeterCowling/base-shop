"use client";

// src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx
// Client component for how-to-get-here dynamic route
import { Fragment, type ReactNode,useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/ui/atoms";

import ArticleStructuredData from "@/components/seo/ArticleStructuredData";
import BreadcrumbStructuredData, { type BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import HowToJsonLd from "@/components/seo/HowToJsonLd";
import { PREVIEW_TOKEN } from "@/config/env";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { RouteDefinition } from "@/lib/how-to-get-here/definitions";
import type { LinkedCopy, RouteContent, RouteContentValue } from "@/lib/how-to-get-here/schema";
import { renderGallery } from "@/routes/how-to-get-here/_galleries";
import { renderCallout } from "@/routes/how-to-get-here/callouts";
import ChiesaNuovaArrivalDropIn from "@/routes/how-to-get-here/chiesaNuovaArrivals/DropIn";
import { getSections, renderSection } from "@/routes/how-to-get-here/sections";
import type { RenderContext } from "@/routes/how-to-get-here/types";
import { getCanonicalUrl } from "@/utils/canonical";

type Props = {
  lang: AppLanguage;
  slug: string;
  definition: RouteDefinition;
  content: RouteContent;
  howToSlug: string;
  guidesSlug: string;
  showChiesaNuovaDetails: boolean;
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
    const linked = value as LinkedCopy;
    const combined = [linked.before, linked.linkLabel, linked.after]
      .filter((segment): segment is string => typeof segment === "string" && segment.trim().length > 0)
      .join(" ")
      .trim();
    return combined.length > 0 ? combined : undefined;
  }
  return undefined;
}

// Naive extraction: find a steps array if present in the content tree
function extractSteps(value: unknown): Array<{ name: string; text?: string }> | null {
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    const steps = rec["steps"];
    if (Array.isArray(steps)) {
      const items = steps
        .map((item: unknown) => {
          if (typeof item === "string") return { name: item };
          if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>;
            const name = (obj["title"] || obj["name"]) as string | undefined;
            const text = (obj["body"] || obj["text"]) as string | undefined;
            if (typeof name === "string" && name.trim()) return { name, text };
          }
          return null;
        })
        .filter(Boolean) as Array<{ name: string; text?: string }>;
      return items.length ? items : null;
    }
    for (const v of Object.values(rec)) {
      const found = extractSteps(v);
      if (found) return found;
    }
  }
  return null;
}

export default function HowToGetHereContent({
  lang,
  slug,
  definition,
  content,
  howToSlug,
  guidesSlug,
  showChiesaNuovaDetails,
}: Props) {
  const { t, ready } = useTranslation("howToGetHere", { lng: lang });
  const { t: tHeader, ready: headerReady } = useTranslation("header", { lng: lang });
  const contentRecord = content as Record<string, RouteContentValue>;

  const hero =
    (contentRecord["hero"] as Record<string, unknown> | undefined) ??
    (contentRecord["header"] as Record<string, unknown> | undefined);
  const callouts = useMemo(() => {
    const entries: Array<[string, unknown]> = [];
    if (contentRecord["tip"]) entries.push(["tip", contentRecord["tip"]]);
    if (contentRecord["cta"]) entries.push(["cta", contentRecord["cta"]]);
    if (contentRecord["aside"]) entries.push(["aside", contentRecord["aside"]]);
    return entries;
  }, [contentRecord]);

  const context: RenderContext = useMemo(
    () => ({
      definition,
      content,
      context: { lang, howToSlug, guidesSlug },
    }),
    [definition, content, lang, howToSlug, guidesSlug]
  );

  const sections = getSections(definition, content);
  const sectionNodes = sections
    .map(([key, value]) =>
      renderSection(key, value, context, definition.sectionPaths ? "" : definition.sectionsRoot ?? "sections")
    )
    .filter(Boolean);

  // Prefer English fallback from the galleries namespace instead of inline default strings
  const tGalleriesEn = i18n.getFixedT?.("en", "howToGetHere");
  const galleriesDefaultAlt = (() => {
    const raw = t("galleries.defaultAlt") as unknown as string;
    if (typeof raw === "string" && raw.trim() && raw !== "galleries.defaultAlt") return raw;
    const fallback = tGalleriesEn ? (tGalleriesEn("galleries.defaultAlt") as unknown as string) : undefined;
    return typeof fallback === "string" && fallback.trim() ? fallback : "defaultAlt";
  })();

  const galleryNodes = renderGallery(definition, content, galleriesDefaultAlt);

  const metaRecord: Record<string, RouteContentValue> | undefined = isRouteContentObject(contentRecord["meta"])
    ? (contentRecord["meta"] as Record<string, RouteContentValue>)
    : undefined;
  const metaTitle = resolveContentString(metaRecord?.["title"]);
  const metaDescription = resolveContentString(metaRecord?.["description"]);
  const heroTitle = hero?.["title"] as string | undefined;

  const canonicalUrl = getCanonicalUrl({ lang, segments: [howToSlug, slug] });

  const isPublished = (definition as { status?: string }).status
    ? (definition as { status?: string }).status === "published"
    : true;
  const previewToken = PREVIEW_TOKEN ?? "";
  const fromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("preview") : null;
  const showPreview = !isPublished && !!previewToken && fromUrl === previewToken;

  const howToSteps = useMemo(() => extractSteps(content) ?? null, [content]);

  const breadcrumb: BreadcrumbList = useMemo(() => {
    const home = `${BASE_URL}/${lang}`;
    const base = `${BASE_URL}/${lang}/${howToSlug}`;
    const title = (() => {
      const direct = heroTitle || (metaTitle ?? "");
      if (direct && String(direct).trim()) return String(direct);
      const fromNs = (ready ? t("breadcrumbs.itemTitleFallback") : "breadcrumbs.itemTitleFallback") as unknown as string;
      if (typeof fromNs === "string" && fromNs.trim() && fromNs !== "breadcrumbs.itemTitleFallback") return fromNs;
      const tHowToEn = i18n.getFixedT?.("en", "howToGetHere");
      const fallback = tHowToEn ? (tHowToEn("breadcrumbs.itemTitleFallback") as unknown as string) : undefined;
      return typeof fallback === "string" && fallback.trim() ? fallback : "breadcrumbs.itemTitleFallback";
    })();
    const homeLabel = (() => {
      const raw = (headerReady ? tHeader("home") : "home") as unknown as string;
      if (typeof raw === "string" && raw.trim() && raw !== "header:home" && raw !== "home") return raw;
      const tHeaderEn = i18n.getFixedT?.("en", "header");
      const fallback = tHeaderEn ? (tHeaderEn("home") as unknown as string) : undefined;
      return typeof fallback === "string" && fallback.trim() ? fallback : "home";
    })();
    const sectionLabel = (() => {
      const raw = (headerReady ? tHeader("howToGetHere") : "howToGetHere") as unknown as string;
      if (typeof raw === "string" && raw.trim() && raw !== "header:howToGetHere") return raw;
      const tHeaderEn = i18n.getFixedT?.("en", "header");
      const fallback = tHeaderEn ? (tHeaderEn("howToGetHere") as unknown as string) : undefined;
      return typeof fallback === "string" && fallback.trim() ? fallback : "howToGetHere";
    })();
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      inLanguage: lang,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: home },
        { "@type": "ListItem", position: 2, name: sectionLabel, item: base },
        { "@type": "ListItem", position: 3, name: title, item: canonicalUrl },
      ],
    } as BreadcrumbList;
  }, [canonicalUrl, headerReady, heroTitle, howToSlug, lang, metaTitle, ready, t, tHeader]);

  return (
    <Fragment>
      {/* Structured Data – Article + Breadcrumb alongside HowTo */}
      <ArticleStructuredData headline={metaTitle ?? ""} description={metaDescription ?? ""} />
      <BreadcrumbStructuredData
        lang={lang}
        items={breadcrumb.itemListElement.map((e) => ({ name: e.name, item: e.item }))}
      />

      <PreviewBanner visible={showPreview} label={t("preview.notPublished")} />
      <Section as="div" padding="wide" className="max-w-5xl text-brand-text dark:text-brand-surface">
        <div className="space-y-10">
          {hero ? (
            <header className="rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/80">
              {hero["eyebrow"] ? (
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary">
                  {hero["eyebrow"] as ReactNode}
                </p>
              ) : null}
              <h1 className="mt-3 text-3xl font-bold text-brand-heading dark:text-brand-surface">
                {hero["title"] as ReactNode}
              </h1>
              {hero["description"] ? (
                <p className="mt-3 text-base leading-relaxed text-brand-text/80 dark:text-brand-surface/80">
                  {hero["description"] as ReactNode}
                </p>
              ) : null}
            </header>
          ) : null}

          {callouts
            .map(([key, value]) => renderCallout(key, value, context))
            .filter(Boolean)
            .map((node) => node)}

          {sectionNodes}

          {showChiesaNuovaDetails ? <ChiesaNuovaArrivalDropIn lang={lang} /> : null}

          {galleryNodes}
          {howToSteps ? <HowToJsonLd lang={lang} url={canonicalUrl} steps={howToSteps} /> : null}
        </div>
      </Section>
    </Fragment>
  );
}

function PreviewBanner({ visible, label }: { visible: boolean; label?: string }): JSX.Element | null {
  if (!visible) return null;
  return (
    <div className="sticky top-0 w-full bg-amber-500/95 px-4 py-2 text-sm font-medium text-brand-heading">{label}</div>
  );
}
