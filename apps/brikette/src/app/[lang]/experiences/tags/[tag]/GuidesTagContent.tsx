"use client";

// src/app/[lang]/experiences/tags/[tag]/GuidesTagContent.tsx
// Client component for guide tag page
import React, { memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { TFunction } from "i18next";

import GuidesTagsStructuredData, { type GuidesTagListItem } from "@/components/seo/GuidesTagsStructuredData";
import { BASE_URL } from "@/config/site";
import { type GuideMeta,GUIDES_INDEX } from "@/data/guides.index";
import { TAGS_SUMMARY } from "@/data/tags.index";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { getGuidesBundle, type GuidesNamespace } from "@/locales/guides";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { getTagMeta } from "@/utils/tags";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

type Props = {
  lang: AppLanguage;
  tag: string;
};

const Section = (props: React.ComponentProps<"section">) => <section {...props} />;
const Grid = (props: React.ComponentProps<"ul">) => <ul {...props} />;
const Inline = (props: React.ComponentProps<"ul">) => <ul {...props} />;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const FALLBACK_LANG = i18nConfig.fallbackLng as AppLanguage;

function fallbackSlugFromKey(key: GuideMeta["key"]): string {
  return key
    .replace(/([a-z\d])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

function stripLangPrefix(slug: string | undefined, lang: string): string | undefined {
  if (!slug) return undefined;
  const trimmed = slug.trim();
  if (!trimmed) return undefined;
  const prefix = `${lang}-`;
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length);
  }
  return trimmed;
}

function safeGuideSlug(lang: AppLanguage, key: GuideMeta["key"]): string | undefined {
  try {
    return guideSlug(lang, key);
  } catch {
    return undefined;
  }
}

function GuidesTagPageContent({ lang, tag }: Props): JSX.Element {
  const { t, i18n, ready } = useTranslation("guides", { lng: lang });
  const { t: tTags } = useTranslation("guides.tags", { lng: lang });

  const items = useMemo<GuideMeta[]>(() => {
    if (!tag) {
      return [];
    }
    const filtered = GUIDES_INDEX.filter((guide) => guide.tags.includes(tag));
    return filtered;
  }, [tag]);

  const shouldNoIndex = items.length < 3;

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!shouldNoIndex) return;
    const existing = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (existing) {
      const content = existing.getAttribute("content") ?? "";
      if (!/noindex/i.test(content)) existing.setAttribute("content", "noindex,follow");
      return;
    }
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex,follow");
    document.head.appendChild(meta);
    return () => {
      try {
        if (document.head.contains(meta)) document.head.removeChild(meta);
      } catch {
        /* ignore in teardown */
      }
    };
  }, [shouldNoIndex]);

  const summary = useMemo(() => TAGS_SUMMARY.find((s) => s.tag === tag), [tag]);

  // Prefer i18n intro when available; otherwise fall back to English
  const i18nIntro = t(`tags.intros.${tag}`);
  const enIntroFromI18n = useMemo(() => {
    if (!tag || !ready) return undefined;
    const value = i18n?.getResource?.(FALLBACK_LANG, "guides", `tags.intros.${tag}`);
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
  }, [i18n, ready, tag]);

  const enGuides = useMemo<GuidesNamespace | undefined>(() => getGuidesBundle("en"), []);
  const enIntro = useMemo(() => {
    if (!enGuides || !tag) return undefined;
    const tagsSection = (enGuides as { tags?: unknown }).tags;
    if (!isRecord(tagsSection)) return undefined;
    const intros = (tagsSection as { intros?: unknown }).intros;
    if (!isRecord(intros)) return undefined;
    const value = (intros as Record<string, unknown>)[tag];
    return typeof value === "string" ? value : undefined;
  }, [enGuides, tag]);

  const customIntro = i18nIntro && i18nIntro !== `tags.intros.${tag}` ? i18nIntro : enIntroFromI18n ?? enIntro;
  const hasCustomIntro = Boolean(customIntro && customIntro.length > 0);
  const top5 = (TAGS_SUMMARY || []).filter((s) => s.tag !== tag).slice(0, 5);
  const tagMeta = getTagMeta(lang, tag);

  const titleKey = `tags.${tag}.title`;
  const descKey = `tags.${tag}.description`;
  const titleI18n = tTags(titleKey);
  const descI18n = tTags(descKey);

  type Translator = TFunction;
  const fallbackGuidesT = useMemo<Translator>(() => {
    const fixed = i18n?.getFixedT?.(FALLBACK_LANG, "guides");
    if (fixed) {
      return fixed as Translator;
    }
    return ((key: string) => key) as unknown as Translator;
  }, [i18n]);

  const guidesSlug = getSlug("guides", lang);
  const guidesBasePath = `/${lang}/${guidesSlug}`;
  const tagPath = tag
    ? `${BASE_URL}${guidesBasePath}/tags/${encodeURIComponent(tag)}`
    : `${BASE_URL}${guidesBasePath}/tags`;

  const resolvedTitle = (titleI18n && titleI18n !== titleKey ? titleI18n : tagMeta?.title) ?? tag;
  const resolvedDescription = (descI18n && descI18n !== descKey ? descI18n : tagMeta?.description) ?? "";

  const resolvedGuides = useMemo(() => {
    if (!items.length)
      return [] as Array<{
        key: GuideMeta["key"];
        label: string;
        href: string;
        structuredUrl: string;
      }>;

    const toRelative = (slug: string | undefined): string | undefined => {
      if (!slug) return undefined;
      const trimmed = slug.trim();
      if (!trimmed) return undefined;
      return trimmed.startsWith("/") ? trimmed : `${guidesBasePath}/${trimmed}`;
    };

    return items.map(({ key }) => {
      const fallbackLabel = getGuideLinkLabel(fallbackGuidesT, fallbackGuidesT, key);
      const label = ready ? getGuideLinkLabel(t, fallbackGuidesT, key) : fallbackLabel;
      const usesFallback = label === fallbackLabel;

      const localSlug = safeGuideSlug(lang as AppLanguage, key);
      const fallbackSlug = stripLangPrefix(safeGuideSlug(FALLBACK_LANG, key), FALLBACK_LANG);
      const fallbackFromKey = fallbackSlugFromKey(key);

      const localRelative = toRelative(localSlug);
      const fallbackRelative = toRelative(fallbackSlug);
      const fallbackKeyRelative = fallbackFromKey !== key ? toRelative(fallbackFromKey) : undefined;

      const href = localRelative ?? fallbackRelative ?? fallbackKeyRelative ?? "#";
      const structuredRelative = usesFallback
        ? fallbackRelative ?? fallbackKeyRelative ?? localRelative
        : localRelative ?? fallbackRelative ?? fallbackKeyRelative;

      const structuredUrl = structuredRelative ? `${BASE_URL}${structuredRelative}` : `${BASE_URL}${guidesBasePath}`;

      return {
        key,
        label,
        href,
        structuredUrl,
      };
    });
  }, [fallbackGuidesT, guidesBasePath, items, lang, ready, t]);

  const structuredItems = useMemo<GuidesTagListItem[]>(
    () =>
      resolvedGuides.map(({ structuredUrl, label }) => ({
        url: structuredUrl,
        name: label,
      })),
    [resolvedGuides]
  );

  return (
    <>
      <GuidesTagsStructuredData
        pageUrl={tagPath}
        name={resolvedTitle}
        description={resolvedDescription}
        items={structuredItems}
        tag={tag}
      />

      <Section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight lg:text-4xl">{resolvedTitle}</h1>
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
          {t("tagPage.articleCount", { count: summary?.count ?? items.length })}
        </p>
        {hasCustomIntro ? (
          <p className="mb-6 text-slate-700 dark:text-slate-300">{customIntro}</p>
        ) : resolvedDescription ? (
          <p className="mb-6 text-slate-700 dark:text-slate-300">{resolvedDescription}</p>
        ) : null}
        <Grid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resolvedGuides.map(({ key, href, label }) => (
            <li key={key}>
              <Link
                href={href}
                className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
              >
                {label}
              </Link>
            </li>
          ))}
        </Grid>
        {top5.length > 0 && (
          <aside className="mt-8 rounded-md border border-slate-200 p-4 dark:border-slate-700">
            <h2 className="mb-2 text-base font-semibold">{t("tagPage.topTagsHeading")}</h2>
            <Inline className="flex flex-wrap gap-2 text-sm">
              {top5.map(({ tag: tname, count }) => (
                <li key={tname}>
                  <Link
                    href={`/${lang}/${guidesSlug}/tags/${encodeURIComponent(tname)}`}
                    className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                  >
                    {tname}
                    <span className="ms-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-700">{count}</span>
                  </Link>
                </li>
              ))}
            </Inline>
          </aside>
        )}
      </Section>
    </>
  );
}

export default memo(GuidesTagPageContent);
