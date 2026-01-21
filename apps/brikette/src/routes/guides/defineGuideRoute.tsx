// src/routes/guides/defineGuideRoute.tsx
import type { ComponentType } from "react";
import { memo } from "react";
import type { LinksFunction,MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";

import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug } from "@/routes.guides-helpers";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { langFromRequest , toAppLanguage } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteMeta } from "@/utils/routeHead";
import { buildLinks as buildSeoLinks } from "@/utils/seo";
import { getSlug } from "@/utils/slug";

import GuideSeoTemplate from "./_GuideSeoTemplate";
import { buildBlockTemplate } from "./blocks";
import { wrapGuideLinks } from "./ensureCanonicalLinkCluster";
import {
  buildGuideChecklist,
  type ChecklistSnapshot,
  guideAreaToSlugKey,
  type GuideChecklistItem,
  type GuideManifestEntry,
} from "./guide-manifest";
import { DEFAULT_OG_IMAGE } from "./guide-seo/constants";
import type { GuideSeoTemplateProps } from "./guide-seo/types";
import getFallbackLanguage from "./utils/getFallbackLanguage";

const loadGuideContentModule = async (
  locale: string,
  contentKey: string,
): Promise<unknown | undefined> => {
  try {
    // i18n-exempt -- TECH-000 [ttl=2026-12-31] dynamic import path for per-guide structured content JSON
    return await import(`../../locales/${locale}/guides/content/${contentKey}.json`);
  } catch {
    return undefined;
  }
};

type TemplateProducer = (entry: GuideManifestEntry) => Partial<GuideSeoTemplateProps>;

type ClientLoader = (args: LoaderFunctionArgs, entry: GuideManifestEntry) => Promise<unknown>;

type MetaProducer = (
  args: Parameters<MetaFunction>[0],
  entry: GuideManifestEntry,
  base: ReturnType<MetaFunction>,
) => ReturnType<MetaFunction>;

type LinksProducer = (
  args: Parameters<LinksFunction>[0],
  entry: GuideManifestEntry,
  base: ReturnType<LinksFunction>,
) => ReturnType<LinksFunction>;

export type GuideLinksArgs = Parameters<LinksFunction>[0];

type AlsoHelpfulSection = Extract<
  NonNullable<GuideSeoTemplateProps["alsoHelpful"]>["section"],
  string
>;

const GUIDE_SECTIONS: ReadonlySet<AlsoHelpfulSection> = new Set([
  "help",
  "experiences",
] as const satisfies readonly AlsoHelpfulSection[]);

function normalizeGuideSection(value: unknown): AlsoHelpfulSection | undefined {
  if (typeof value === "string" && GUIDE_SECTIONS.has(value as AlsoHelpfulSection)) {
    return value as AlsoHelpfulSection;
  }
  return undefined;
}

function mergeTemplateFragments(
  base: Partial<GuideSeoTemplateProps>,
  patch: Partial<GuideSeoTemplateProps>,
): Partial<GuideSeoTemplateProps> {
  if (!patch || Object.keys(patch).length === 0) return { ...base };
  const merged: Partial<GuideSeoTemplateProps> = { ...base, ...patch };
  if (base?.genericContentOptions || patch?.genericContentOptions) {
    merged.genericContentOptions = {
      ...(base?.genericContentOptions ?? {}),
      ...(patch?.genericContentOptions ?? {}),
    };
  }
  if (base?.relatedGuides || patch?.relatedGuides) {
    const related = {
      ...(base?.relatedGuides ?? {}),
      ...(patch?.relatedGuides ?? {}),
    };
    if (Array.isArray(related.items) && related.items.length > 0) {
      merged.relatedGuides = {
        ...related,
        items: [...related.items],
      };
    }
  }
  if (base?.alsoHelpful || patch?.alsoHelpful) {
    const alsoHelpful = {
      ...(base?.alsoHelpful ?? {}),
      ...(patch?.alsoHelpful ?? {}),
    };
    if (Array.isArray(alsoHelpful.tags) && alsoHelpful.tags.length > 0) {
      const excludeGuide = Array.isArray(alsoHelpful.excludeGuide)
        ? [...alsoHelpful.excludeGuide]
        : alsoHelpful.excludeGuide;
      const section = normalizeGuideSection(alsoHelpful.section);
      merged.alsoHelpful = {
        ...alsoHelpful,
        tags: [...alsoHelpful.tags],
        ...(excludeGuide !== undefined ? { excludeGuide } : {}),
        ...(section ? { section } : {}),
      };
    }
  }
  return merged;
}

export interface GuideRouteArtifacts {
  Component: ComponentType;
  clientLoader: (args: LoaderFunctionArgs) => Promise<unknown>;
  meta: MetaFunction;
  links: LinksFunction;
  manifest: GuideManifestEntry;
  checklist: ChecklistSnapshot;
}

export type GuideRouteLoaderData = {
  lang: AppLanguage;
  guide: GuideManifestEntry["key"];
  status: GuideManifestEntry["status"];
  checklist: ChecklistSnapshot | GuideChecklistItem[];
} & Record<string, unknown>;

export interface GuideRouteFactoryOptions {
  /**
   * Provide template-specific props (article lead, extras, structured data hooks, etc.).
   * Handlers receive the manifest entry so they can reference shared config.
   */
  template?: TemplateProducer;
  /**
   * Override the default client loader when bespoke behaviour is required. Returning null or
   * undefined falls back to the default loader's return payload.
   */
  clientLoader?: ClientLoader;
  /**
   * Customize the meta payload. The base meta includes canonical + translation-sourced title
   * placeholders derived from the manifest metadata.
   */
  meta?: MetaProducer;
  /**
   * Customize the links payload (canonical and hreflang cluster). Defaults to the shared helper.
   */
  links?: LinksProducer;
}

function createTemplateComponent(
  entry: GuideManifestEntry,
  baseTemplate: Partial<GuideSeoTemplateProps>,
  template?: TemplateProducer,
): ComponentType {
  const Template = function GuideRouteTemplate(): JSX.Element {
    const overrideProps = typeof template === "function" ? template(entry) : {};
    const optionProps: Partial<GuideSeoTemplateProps> = {};
    if (entry.options?.showPlanChoice != null) optionProps.showPlanChoice = entry.options.showPlanChoice;
    if (entry.options?.showTransportNotice != null) optionProps.showTransportNotice = entry.options.showTransportNotice;
    if (entry.options?.showTagChips != null) optionProps.showTagChips = entry.options.showTagChips;
    if (entry.options?.showTocWhenUnlocalized != null) {
      optionProps.showTocWhenUnlocalized = entry.options.showTocWhenUnlocalized;
    }
    if (entry.options?.showRelatedWhenLocalized != null) {
      optionProps.showRelatedWhenLocalized = entry.options.showRelatedWhenLocalized;
    }
    if (entry.options?.suppressTocTitle != null) optionProps.suppressTocTitle = entry.options.suppressTocTitle;
    if (entry.options?.suppressUnlocalizedFallback != null) {
      optionProps.suppressUnlocalizedFallback = entry.options.suppressUnlocalizedFallback;
    }
    if (entry.options?.preferManualWhenUnlocalized != null) {
      optionProps.preferManualWhenUnlocalized = entry.options.preferManualWhenUnlocalized;
    }
    if (entry.options?.renderGenericWhenEmpty != null) {
      optionProps.renderGenericWhenEmpty = entry.options.renderGenericWhenEmpty;
    }
    if (entry.options?.ogType) optionProps.ogType = entry.options.ogType;
    if (entry.options?.preferGenericWhenFallback != null) {
      optionProps.preferGenericWhenFallback = entry.options.preferGenericWhenFallback;
    }

    const templateWithOptions = mergeTemplateFragments(baseTemplate, optionProps);
    const mergedTemplateProps = mergeTemplateFragments(templateWithOptions, overrideProps);

    return (
      <GuideSeoTemplate
        guideKey={entry.key}
        metaKey={entry.metaKey ?? entry.key}
        {...mergedTemplateProps}
      />
    );
  };
  Template.displayName = `GuideRoute(${entry.key})`;
  return memo(Template);
}

function defaultMetaFactory(entry: GuideManifestEntry): MetaFunction {
  return ({ data }) => {
    const d = (data ?? {}) as { lang?: unknown };
    const dataLang = typeof d.lang === "string" ? d.lang : undefined;
    const lang = toAppLanguage(dataLang ?? getFallbackLanguage());
    const baseKey = guideAreaToSlugKey(entry.primaryArea);
    const areaSlug = getSlug(baseKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    const ogImageUrl = buildCfImageUrl(DEFAULT_OG_IMAGE.path, {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
    });
    const base = buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: ogImageUrl, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
    return base;
  };
}

function defaultLinksFactory(entry: GuideManifestEntry): LinksFunction {
  return (...factoryArgs: Parameters<LinksFunction>) => {
    const [args] = factoryArgs;
    const safeArgs = (args ?? {}) as {
      data?: { lang?: unknown } | null;
      params?: { lang?: unknown } | null;
      request?: { url?: unknown } | null;
    };

    const toLang = (value?: { lang?: unknown } | null): string | undefined => {
      const langValue = value?.lang;
      return typeof langValue === "string" ? langValue : undefined;
    };

    const dataLang = toLang(safeArgs.data);
    const paramLang = toLang(safeArgs.params);

    const lang = toAppLanguage(dataLang ?? paramLang ?? undefined);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;

    let origin = BASE_URL;
    const toUrl = (value?: { url?: unknown } | null): string | undefined => {
      const urlValue = value?.url;
      return typeof urlValue === "string" ? urlValue : undefined;
    };

    const requestUrl = toUrl(safeArgs.request);

    if (typeof requestUrl === "string") {
      try {
        origin = new URL(requestUrl).origin;
      } catch {
        origin = BASE_URL;
      }
    }

    const descriptors = buildSeoLinks({
      lang,
      origin,
      path,
    });

    const normalized = descriptors.map(({ rel, href, hrefLang }) => ({
      rel,
      href,
      ...(hrefLang ? { hrefLang } : {}),
    }));

    const toAbsoluteHref = (pathname: string): string => {
      const trimmed = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
      if (!trimmed || trimmed === "/") {
        return origin;
      }
      const safePath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
      return `${origin}${safePath}`;
    };

    const hasCanonical = normalized.some((descriptor) => descriptor.rel === "canonical");
    if (!hasCanonical) {
      normalized.unshift({ rel: "canonical", href: toAbsoluteHref(path) });
    }

    const hasXDefault = normalized.some(
      (descriptor) => descriptor.rel === "alternate" && descriptor.hrefLang === "x-default",
    );
    if (!hasXDefault) {
      const fallbackLang = toAppLanguage(getFallbackLanguage());
      const fallbackAreaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), fallbackLang);
      const fallbackPath = `/${fallbackLang}/${fallbackAreaSlug}/${guideSlug(fallbackLang, entry.key)}`;
      normalized.push({
        rel: "alternate",
        href: toAbsoluteHref(fallbackPath),
        hrefLang: "x-default",
      });
    }

    return normalized;
  };
}

async function defaultClientLoader(args: LoaderFunctionArgs, entry: GuideManifestEntry) {
  const lang = langFromRequest(args.request);
  await preloadNamespacesWithFallback(lang, ["guides", "guidesFallback"], {
    fallbackOptional: false,
  });
  await i18n.changeLanguage(lang);
  const loadContent = async (locale: string) => loadGuideContentModule(locale, entry.contentKey);
  await ensureGuideContent(lang, entry.contentKey, {
    en: () => loadContent("en"),
    local: lang === "en" ? undefined : () => loadContent(lang),
  });
  const checklistSnapshot = buildGuideChecklist(entry);
  return {
    lang,
    guide: entry.key,
    status: entry.status,
    checklist: checklistSnapshot.items,
  };
}

export function defineGuideRoute(
  entry: GuideManifestEntry,
  options: GuideRouteFactoryOptions = {},
): GuideRouteArtifacts {
  const blockTemplate = buildBlockTemplate(entry);
  const nodeEnv = typeof process !== "undefined" ? process.env.NODE_ENV : undefined;
  const shouldWarn = nodeEnv !== "production" && nodeEnv !== "test";
  if (shouldWarn && blockTemplate.warnings.length > 0) {
    for (const warning of blockTemplate.warnings) {
      console.warn(`[defineGuideRoute] ${warning} (guide: ${entry.key})`);
    }
  }

  const Component = createTemplateComponent(entry, blockTemplate.template, options.template);
  const baseMeta = defaultMetaFactory(entry);
  const baseLinks = defaultLinksFactory(entry);

  const meta: MetaFunction =
    typeof options.meta === "function"
      ? (args) => options.meta!(args, entry, baseMeta(args))
      : baseMeta;

  const links: LinksFunction =
    typeof options.links === "function"
      ? wrapGuideLinks(entry, (...linkArgs: Parameters<LinksFunction>) => {
          const [firstArg] = linkArgs;
          const baseDescriptors = baseLinks(...linkArgs);
          return options.links!(firstArg, entry, baseDescriptors);
        })
      : wrapGuideLinks(entry, baseLinks);

  const clientLoader = async (args: LoaderFunctionArgs) => {
    const base = (await defaultClientLoader(args, entry)) as GuideRouteLoaderData;
    if (!options.clientLoader) {
      return base;
    }
    const result = await options.clientLoader(args, entry);
    if (result == null) return base;
    if (typeof result === "object" && !Array.isArray(result)) {
      return { ...base, ...(result as Record<string, unknown>) };
    }
    return base;
  };

  const checklist = buildGuideChecklist(entry);

  return {
    Component,
    clientLoader,
    meta,
    links,
    manifest: entry,
    checklist,
  };
}
