// src/routes/guides/defineGuideRoute.tsx
import { memo, type ReactNode } from "react";
import type { ComponentType } from "react";
import type { MetaFunction, LinksFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";

import GuideSeoTemplate from "./_GuideSeoTemplate";
import type {
  GuideSeoTemplateContext,
  GuideSeoTemplateProps,
  TocItem,
  StructuredArticleConfig,
} from "./guide-seo/types";
import {
  buildGuideChecklist,
  guideAreaToSlugKey,
  type ChecklistSnapshot,
  type GuideManifestEntry,
} from "./guide-manifest";
import { buildBlockTemplate } from "./blocks";

import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import i18n from "@/i18n";
import { buildRouteMeta, buildRouteLinks, resolveMetaLangs } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import { i18nConfig, type AppLanguage } from "@/i18n.config";

const GUIDE_CONTENT_LOADERS = import.meta.glob("../../locales/*/guides/content/*.json"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI glob matcher for content bundles

type TemplateProducer = (entry: GuideManifestEntry) => Partial<GuideSeoTemplateProps>;

type ClientLoader = (args: LoaderFunctionArgs, entry: GuideManifestEntry) => Promise<unknown>;

type MetaProducer = (
  args: Parameters<MetaFunction>[0],
  entry: GuideManifestEntry,
  base: ReturnType<MetaFunction>,
) => ReturnType<MetaFunction>;

export type GuideLinksArgs = Parameters<LinksFunction>[0];

type LinksProducer = (
  args: GuideLinksArgs,
  entry: GuideManifestEntry,
  base: ReturnType<LinksFunction>,
) => ReturnType<LinksFunction>;

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
    merged.relatedGuides = {
      ...(base?.relatedGuides ?? {}),
      ...(patch?.relatedGuides ?? {}),
    };
  }
  if (base?.alsoHelpful || patch?.alsoHelpful) {
    merged.alsoHelpful = {
      ...(base?.alsoHelpful ?? {}),
      ...(patch?.alsoHelpful ?? {}),
    };
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
  checklist: ChecklistSnapshot;
} & Record<string, unknown>;

export interface GuideRouteFactoryOptions {
  /**
   * Provide template-specific props (article lead, extras, structured data hooks, etc.).
   * Handlers receive the manifest entry so they can reference shared config.
   */
  template?: TemplateProducer;
  /**
   * Optional structured article configuration for routes that render bespoke
   * structured content instead of relying solely on GenericContent.
   */
  structuredArticle?: StructuredArticleConfig;
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

type StructuredLeadBuilderOptions<Extras> = {
  guideKey: GuideSeoTemplateContext["guideKey"];
  buildExtras: (context: GuideSeoTemplateContext) => Extras;
  render: (context: GuideSeoTemplateContext, extras: Extras) => ReactNode;
  /**
   * Optional override for structured article rendering. Defaults to using the
   * primary render function when the extras are considered structured.
   */
  renderStructured?: (extras: Extras, context: GuideSeoTemplateContext) => ReactNode;
  /**
   * Optional override for fallback rendering. Defaults to the primary render
   * function when extras are not structured.
   */
  renderFallback?: (context: GuideSeoTemplateContext, extras: Extras) => ReactNode;
  /**
   * Optional selector for ToC items. Defaults to the context-provided ToC.
   */
  selectTocItems?: (extras: Extras, context: GuideSeoTemplateContext) => TocItem[] | null | undefined;
  /**
   * Determines whether the extras represent structured content. Defaults to
   * probing a `hasStructured` flag on the extras or the context localization.
   */
  isStructured?: (extras: Extras, context: GuideSeoTemplateContext) => boolean;
};

type StructuredLeadBuilderResult<Extras> = {
  articleLead: (context?: GuideSeoTemplateContext | null) => ReactNode;
  structuredArticle: StructuredArticleConfig<Extras>;
};

export function createStructuredLeadWithBuilder<Extras>({
  guideKey,
  buildExtras,
  render,
  renderStructured,
  renderFallback,
  selectTocItems,
  isStructured,
}: StructuredLeadBuilderOptions<Extras>): StructuredLeadBuilderResult<Extras> {
  const extrasCache = new WeakMap<GuideSeoTemplateContext, Map<AppLanguage, Extras>>();

  const isValidContext = (
    candidate: unknown,
  ): candidate is GuideSeoTemplateContext => candidate != null && typeof candidate === "object";

  const resolveExtras = (context: GuideSeoTemplateContext): Extras => {
    const lang = context.lang;
    let cache = extrasCache.get(context);
    if (!cache) {
      cache = new Map<AppLanguage, Extras>();
      extrasCache.set(context, cache);
    }
    if (cache.has(lang)) {
      return cache.get(lang)!;
    }
    const value = buildExtras(context);
    cache.set(lang, value);
    return value;
  };

  const resolveIsStructured = (extras: Extras, context: GuideSeoTemplateContext): boolean => {
    try {
      if (typeof isStructured === "function") {
        return Boolean(isStructured(extras, context));
      }
      if (extras && typeof extras === "object" && "hasStructured" in (extras as Record<string, unknown>)) {
        const candidate = (extras as Record<string, unknown>).hasStructured;
        if (typeof candidate === "boolean") return candidate;
      }
      return Boolean(context.hasLocalizedContent);
    } catch {
      return false;
    }
  };

  const resolveTocItems = (extras: Extras, context: GuideSeoTemplateContext): TocItem[] => {
    try {
      const items = selectTocItems?.(extras, context);
      if (Array.isArray(items)) {
        return items;
      }
    } catch {
      // ignore selector errors and fall back to context ToC
    }
    const fallback = Array.isArray(context.toc) ? context.toc : [];
    return fallback.slice();
  };

  const renderLead = (context?: GuideSeoTemplateContext | null) => {
    if (!isValidContext(context)) {
      return null;
    }
    const extras = resolveExtras(context);
    return render(context, extras);
  };

  return {
    articleLead: renderLead,
    structuredArticle: {
      guideKey,
      getExtras: (context) => resolveExtras(context),
      renderStructured: (extras, context) => {
        if (typeof renderStructured === "function") {
          return renderStructured(extras, context);
        }
        return resolveIsStructured(extras, context) ? render(context, extras) : null;
      },
      renderFallback: (context, extras) => {
        if (typeof renderFallback === "function") {
          return renderFallback(context, extras);
        }
        return resolveIsStructured(extras, context) ? null : render(context, extras);
      },
      selectTocItems: (extras, context) => resolveTocItems(extras, context),
      isStructured: (extras, context) => resolveIsStructured(extras, context),
    },
  };
}

function createTemplateComponent(
  entry: GuideManifestEntry,
  baseTemplate: Partial<GuideSeoTemplateProps>,
  template?: TemplateProducer,
  structuredArticle?: StructuredArticleConfig,
): ComponentType {
  const Template = function GuideRouteTemplate(): JSX.Element {
    const overrideProps = useMemo(() => {
      const baseOverrides = typeof template === "function" ? template(entry) : {};
      if (!structuredArticle) return baseOverrides;
      const hasStructuredOverride =
        baseOverrides && typeof baseOverrides === "object" && "structuredArticle" in baseOverrides;
      if (hasStructuredOverride && (baseOverrides as Partial<GuideSeoTemplateProps>).structuredArticle != null) {
        return baseOverrides;
      }
      return { ...baseOverrides, structuredArticle };
    }, [entry, template, structuredArticle]);
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
  return (args) => {
    const d = ((args ?? {}) as { data?: unknown })?.data as { lang?: AppLanguage } | undefined;
    const lang = d.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(entry.primaryArea);
    const areaSlug = getSlug(baseKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    const base = buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
    return base;
  };
}

function defaultLinksFactory(entry: GuideManifestEntry): LinksFunction {
  return (args: GuideLinksArgs) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: AppLanguage } | undefined;
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(entry.primaryArea);
    const areaSlug = getSlug(baseKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  };
}

async function defaultClientLoader(args: LoaderFunctionArgs, entry: GuideManifestEntry) {
  const lang = langFromRequest(args.request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  const loadContent = async (locale: string) => {
    const key = `../../locales/${locale}/guides/content/${entry.contentKey}.json`;
    const loader = GUIDE_CONTENT_LOADERS[key];
    if (typeof loader !== "function") return undefined;
    try {
      return await loader();
    } catch {
      return undefined;
    }
  };
  await ensureGuideContent(lang, entry.contentKey, {
    en: () => loadContent("en"),
    local: lang === "en" ? undefined : () => loadContent(lang),
  });
  return { lang, guide: entry.key, status: entry.status, checklist: buildGuideChecklist(entry) };
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

  const Component = createTemplateComponent(entry, blockTemplate.template, options.template, options.structuredArticle);
  const baseMeta = defaultMetaFactory(entry);
  const baseLinks = defaultLinksFactory(entry);

  const meta: MetaFunction =
    typeof options.meta === "function"
      ? (args) => options.meta!(args, entry, baseMeta(args))
      : baseMeta;

  const links: LinksFunction =
    typeof options.links === "function"
      ? (args: GuideLinksArgs) => options.links!(args, entry, baseLinks(args))
      : baseLinks;

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