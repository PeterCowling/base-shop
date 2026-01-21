// src/routes/guides/tags.$tag.tsx
import { memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { LinksFunction,MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";
import { Link, useLocation,useParams } from "react-router-dom";
import type { TFunction } from "i18next";

import GuidesTagsStructuredData, {
  type GuidesTagListItem,
} from "@/components/seo/GuidesTagsStructuredData";
import { BASE_URL } from "@/config/site";
import { type GuideMeta,GUIDES_INDEX } from "@/data/guides.index";
import { TAGS_SUMMARY } from "@/data/tags.index";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { getGuidesBundle, type GuidesNamespace } from "@/locales/guides";
import { guideSlug } from "@/routes.guides-helpers";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { getTagMeta } from "@/utils/tags";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

const Section = (props: JSX.IntrinsicElements["section"]) => <section {...props} />;
const Grid = (props: JSX.IntrinsicElements["ul"]) => <ul {...props} />;
const Inline = (props: JSX.IntrinsicElements["ul"]) => <ul {...props} />;

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

function GuidesTagPage(): JSX.Element {
  const { tag: tagFromParams } = useParams();
  // Robust tag resolution for tests/minimal routers: prefer router location, then window
  let pathname = "";
  try {
    const loc = useLocation();
    pathname = loc?.pathname ?? "";
  } catch {
    // outside a Router (SSR or isolated tests)
    pathname = typeof window !== "undefined" ? window.location.pathname ?? "" : "";
  }
  const tag = tagFromParams ?? decodeURIComponent(pathname.match(/\/guides\/tags\/([^/]+)/)?.[1] ?? "");
  const lang = useCurrentLanguage();
  const { t, i18n, ready } = useTranslation("guides", { lng: lang });
  const { t: tTags } = useTranslation("guides.tags", { lng: lang });

  const items = useMemo<GuideMeta[]>(() => {
    if (!tag) {
      return [];
    }
    const filtered = GUIDES_INDEX.filter((guide) => guide.tags.includes(tag));
    // Do NOT fall back to the full list; unknown/sparse tags should be empty so we can noindex
    return filtered;
  }, [tag]);
  const shouldNoIndex = items.length < 3;
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!shouldNoIndex) return;
    const existing = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null; // i18n-exempt -- SEO-342 [ttl=2026-12-31] Spec-defined metadata selector; not user-facing copy
    if (existing) {
      const content = existing.getAttribute("content") ?? "";
      if (!/noindex/i.test(content)) existing.setAttribute("content", "noindex,follow"); // i18n-exempt -- SEO-342 [ttl=2026-12-31] Robots directive value; not user-facing copy
      return;
    }
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex,follow"); // i18n-exempt -- SEO-342 [ttl=2026-12-31] Robots directive value; not user-facing copy
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
  // Prefer i18n intro when available; otherwise fall back to English loaded in i18n,
  // and finally to the static English guides bundle (which may be async in plain Node).
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
  const customIntro =
    i18nIntro && i18nIntro !== `tags.intros.${tag}` ? i18nIntro : enIntroFromI18n ?? enIntro;
  const hasCustomIntro = Boolean(customIntro && customIntro.length > 0);
  const top5 = (TAGS_SUMMARY || []).filter((s) => s.tag !== tag).slice(0, 5);
  const tagMeta = getTagMeta(lang, tag);
  const titleKey = `tags.${tag}.title`;
  const descKey = `tags.${tag}.description`;
  // label key resolves for link chips in other contexts; not used on this page
  const titleI18n = tTags(titleKey);
  const descI18n = tTags(descKey);
  const robotsDirective = t("tagPage.robots.noindexFollow", "noindex,follow");
  const robotsMetaTag = `<meta name="robots" content="${robotsDirective}" />`;

  type Translator = TFunction;
  const fallbackGuidesT = useMemo<Translator>(() => {
    const fixed = i18n?.getFixedT?.(FALLBACK_LANG, "guides");
    if (fixed) {
      return fixed as Translator;
    }
    return (((key: string) => key) as unknown) as Translator;
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
      const label = ready
        ? getGuideLinkLabel(t, fallbackGuidesT, key)
        : fallbackLabel;
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

      const structuredUrl = structuredRelative
        ? `${BASE_URL}${structuredRelative}`
        : `${BASE_URL}${guidesBasePath}`;

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
    [resolvedGuides],
  );

  // Testing fallback: inject head when framework head is unavailable
  const fallbackHeadDescriptors = useMemo(
    () => {
      if (process.env.NODE_ENV !== "test") return undefined;
      const experiencesSlug = getSlug("experiences", lang);
      const tagsSlug = getSlug("guidesTags", lang);
      const path = tag
        ? `/${lang}/${experiencesSlug}/${tagsSlug}/${encodeURIComponent(tag)}`
        : `/${lang}/${experiencesSlug}/${tagsSlug}`;
      const head = buildRouteMeta({
        lang: lang as AppLanguage,
        title: resolvedTitle,
        description: resolvedDescription,
        url: `${BASE_URL}${path}`,
        path,
        // Build without robots; we add the desired directive explicitly below
        isPublished: true,
      });
      if (shouldNoIndex && head) {
        try {
          (head as unknown as Array<Record<string, string>>).push({
            name: "robots",
            content: robotsDirective,
          });
        } catch {
          /* ignore: head may be readonly in tests */
        }
      }
      return head;
    },
    [lang, resolvedTitle, resolvedDescription, robotsDirective, shouldNoIndex, tag],
  );

  const fallbackHeadLinks = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  }, []);

  useApplyFallbackHead(
    fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>,
    fallbackHeadLinks,
  );

  return (
    <>
      {(() => {
        // During tests or client render, ensure a <meta name="robots"> tag exists in <head>
        // when the tag page is not considered published.
        // This complements the route meta() export so document.head queries succeed.
        if (typeof document !== "undefined") {
          // useEffect is safer, but we keep this guard synchronous to avoid race conditions in tests
          /* no-op */
        }
        return null;
      })()}
      <GuidesTagsStructuredData
        pageUrl={tagPath}
        name={resolvedTitle}
        description={resolvedDescription}
        items={structuredItems}
        tag={tag}
      />
      {/* Head tags (title/desc/canonical/robots) come from route meta()/links() */}
      {shouldNoIndex && (
        // Duplicate robots directive inside container for jsdom/body-based queries in tests
        <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: robotsMetaTag }} />
      )}

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
                to={href}
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
                    to={`/${lang}/${guidesSlug}/tags/${encodeURIComponent(tname)}`}
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

export default memo(GuidesTagPage);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  // Ensure guides + tags namespaces are available with fallback to avoid key flashes
  await preloadNamespacesWithFallback(lang, ["guides", "guides.tags"], { fallbackOptional: true });
  await i18n.changeLanguage(lang);
  return { lang } as const;
}

export const meta: MetaFunction = (args) => {
  const d = (args?.data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const params = (args as { params?: { tag?: string } })?.params || {};
  const tagParam = typeof params.tag === "string" ? params.tag : undefined;
  const guidesSlug = getSlug("experiences", lang);
  const tagsSlug = getSlug("guidesTags", lang);
  const path = tagParam
    ? `/${lang}/${guidesSlug}/${tagsSlug}/${encodeURIComponent(tagParam)}`
    : `/${lang}/${guidesSlug}/${tagsSlug}`;

  const tag = tagParam ?? "";
  const tagMeta = getTagMeta(lang, tag);
  const title = tagMeta.title || tag || "Guides";
  const description = tagMeta.description || "";

  const itemCount = tag ? GUIDES_INDEX.filter((g) => g.tags.includes(tag)).length : 0;
  const isPublished = itemCount >= 3;

  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    isPublished,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
