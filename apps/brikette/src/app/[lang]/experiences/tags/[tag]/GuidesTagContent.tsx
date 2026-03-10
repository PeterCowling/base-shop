"use client";

/* eslint-disable ds/no-hardcoded-copy -- PUB-05 pre-existing */
// src/app/[lang]/experiences/tags/[tag]/GuidesTagContent.tsx
// Client component for guide tag page
import React, { memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { TFunction } from "i18next";

import GuidesTagsStructuredData, { type GuidesTagListItem } from "@/components/seo/GuidesTagsStructuredData";
import { BASE_URL } from "@/config/site";
import { type GuideMeta,GUIDES_INDEX, isGuideLive } from "@/data/guides.index";
import { TAGS_SUMMARY } from "@/data/tags.index";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { getGuidesBundle } from "@/locales/guides";
import { guideHref } from "@/routes.guides-helpers";
import { getLocalizedSectionPath } from "@/utils/localizedRoutes";
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
const EN_GUIDES = getGuidesBundle("en");

function GuidesTagPageContent({ lang, tag }: Props): JSX.Element {
  const { t, i18n, ready } = useTranslation("guides", { lng: lang });
  const { t: tTags } = useTranslation("guides.tags", { lng: lang });

  const items = useMemo<GuideMeta[]>(
    () => (tag ? GUIDES_INDEX.filter((guide) => guide.tags.includes(tag) && isGuideLive(guide.key)) : []),
    [tag],
  );

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
  const customIntro = useMemo(() => {
    const localized = i18nIntro && i18nIntro !== `tags.intros.${tag}` ? i18nIntro : undefined;
    if (localized) return localized;
    if (tag && ready) {
      const fromResource = i18n?.getResource?.(FALLBACK_LANG, "guides", `tags.intros.${tag}`);
      if (typeof fromResource === "string" && fromResource.trim().length > 0) return fromResource;
    }
    if (EN_GUIDES && tag) {
      const tagsSection = (EN_GUIDES as { tags?: unknown }).tags;
      if (isRecord(tagsSection)) {
        const intros = (tagsSection as { intros?: unknown }).intros;
        if (isRecord(intros)) {
          const value = (intros as Record<string, unknown>)[tag];
          if (typeof value === "string") return value;
        }
      }
    }
    return undefined;
  }, [tag, i18nIntro, ready, i18n]);
  const hasCustomIntro = !!customIntro;
  const top5 = useMemo(() => TAGS_SUMMARY.filter((s) => s.tag !== tag).slice(0, 5), [tag]);
  const tagMeta = useMemo(() => getTagMeta(lang, tag), [lang, tag]);

  const titleKey = `tags.${tag}.title`;
  const descKey = `tags.${tag}.description`;
  const titleI18n = tTags(titleKey);
  const descI18n = tTags(descKey);

  type Translator = TFunction;
  const fallbackGuidesT = useMemo<Translator>(() => {
    const fixed = i18n?.getFixedT?.(FALLBACK_LANG, "guides");
    if (fixed) return fixed as Translator;
    return ((key: string) => key) as unknown as Translator;
  }, [i18n]);

  const tagsBasePath = useMemo(() => getLocalizedSectionPath(lang, "guidesTags"), [lang]);
  const tagPath = useMemo(
    () => tag ? `${BASE_URL}${tagsBasePath}/${encodeURIComponent(tag)}` : `${BASE_URL}${tagsBasePath}`,
    [tag, tagsBasePath],
  );

  const resolvedTitle = useMemo(
    () => (titleI18n && titleI18n !== titleKey ? titleI18n : tagMeta?.title) ?? tag,
    [titleI18n, titleKey, tagMeta, tag],
  );
  const resolvedDescription = useMemo(
    () => (descI18n && descI18n !== descKey ? descI18n : tagMeta?.description) ?? "",
    [descI18n, descKey, tagMeta],
  );

  const { resolvedGuides, structuredItems } = useMemo(() => {
    if (!items.length) return { resolvedGuides: [], structuredItems: [] as GuidesTagListItem[] };
    const guides = items.map(({ key }) => {
      const fallbackLabel = getGuideLinkLabel(fallbackGuidesT, fallbackGuidesT, key);
      const label = ready ? getGuideLinkLabel(t, fallbackGuidesT, key) : fallbackLabel;
      const href = guideHref(lang, key);
      return { key, label, href, structuredUrl: `${BASE_URL}${href}` };
    });
    return {
      resolvedGuides: guides,
      structuredItems: guides.map(({ structuredUrl, label }) => ({ url: structuredUrl, name: label })),
    };
  }, [items, ready, t, fallbackGuidesT, lang]);

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
        <p className="mb-2 text-sm text-muted">
          {t("tagPage.articleCount", { count: summary?.count ?? items.length })}
        </p>
        {hasCustomIntro ? (
          <p className="mb-6 text-secondary">{customIntro}</p>
        ) : resolvedDescription ? (
          <p className="mb-6 text-secondary">{resolvedDescription}</p>
        ) : null}
        <Grid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resolvedGuides.map(({ key, href, label }) => (
            <li key={key}>
              <Link
                href={href}
                className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:border-brand-secondary/35 dark:bg-brand-surface dark:text-brand-text dark:hover:text-brand-secondary"
              >
                {label}
              </Link>
            </li>
          ))}
        </Grid>
        {top5.length > 0 && (
          <aside className="mt-8 rounded-md border border-1 p-4">
            <h2 className="mb-2 text-base font-semibold">{t("tagPage.topTagsHeading")}</h2>
            <Inline className="flex flex-wrap gap-2 text-sm">
              {top5.map(({ tag: tname, count }) => (
                <li key={tname}>
                  <Link
                    href={`${tagsBasePath}/${encodeURIComponent(tname)}`}
                    className="inline-flex items-center rounded-full border border-2 px-3 py-1 hover:bg-surface-1"
                  >
                    {tname}
                    <span className="ms-2 rounded bg-surface-1 px-1.5 py-0.5 text-xs">{count}</span>
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
