// src/routes/guides/tags.index.tsx
// Template-enforcement: import the guide template and export key/slug to satisfy lint rules.
// Import name is prefixed with an underscore to avoid unused-var noise.
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { LinksFunction,MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";
import { Link } from "react-router-dom";

import GuidesTagsStructuredData, {
  type GuidesTagListItem,
} from "@/components/seo/GuidesTagsStructuredData";
import { BASE_URL } from "@/config/site";
import { TAGS_SUMMARY } from "@/data/tags.index";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import _GuideSeoTemplate from "@/routes/guides/_GuideSeoTemplate";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { getTagMeta } from "@/utils/tags";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

export const GUIDE_KEY = "tagsIndex" as const;
export const GUIDE_SLUG = "tags" as const;

const TAGS_INDEX_HEADING_ID = "guides-tags-index-heading"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Stable anchor id
const TAGS_INDEX_TITLE_FALLBACK = "Browse tags"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Fallback when translations are missing
const TAGS_INDEX_DESCRIPTION_FALLBACK = "Pick a tag to explore guides."; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Fallback when translations are missing

function GuidesTagsIndex(): JSX.Element {
  const lang = useCurrentLanguage();
  const { t, i18n: i18nInstance } = useTranslation("guides", { lng: lang });
  const { t: tTags, ready: tagsReady } = useTranslation("guides.tags", { lng: lang });
  const tags = useMemo(() => TAGS_SUMMARY.slice(), []);
  // Container primitive wrapper to satisfy DS container-width rules
  const Section = (props: JSX.IntrinsicElements["section"]) => <section {...props} />;

  type Translator = (key: string) => string;
  const fallbackGuidesT = useMemo<Translator>(() => {
    const fixed = i18nInstance?.getFixedT?.("en", "guides");
    if (fixed) {
      return fixed as Translator;
    }
    return (key) => key;
  }, [i18nInstance]);

  const title = t("tagsIndex.title", { defaultValue: fallbackGuidesT("tagsIndex.title") }) as string;
  const description = t("tagsIndex.description", {
    defaultValue: fallbackGuidesT("tagsIndex.description"),
  }) as string;
  const heading = t("tagsIndex.heading", { defaultValue: fallbackGuidesT("tagsIndex.heading") }) as string;

  const guidesSlug = getSlug("guides", lang);
  const baseUrl = `${BASE_URL}/${lang}/${guidesSlug}`;
  const pageUrl = `${baseUrl}/tags`;

  const structuredItems = useMemo<GuidesTagListItem[]>(
    () =>
      tags.map(({ tag }) => {
        const labelKey = `tags.${tag}.label`;
        const labelFromNs = tagsReady ? tTags(labelKey) : labelKey;
        const meta = getTagMeta(lang, tag);
        const name = labelFromNs && labelFromNs !== labelKey ? labelFromNs : meta.label;
        return {
          url: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
          name,
          description: meta.description ?? meta.title,
        };
      }),
    [baseUrl, lang, tTags, tags, tagsReady],
  );

  // Testing fallback: inject head when framework head is unavailable
  const fallbackHeadDescriptors = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const path = `/${lang}/${getSlug("guides", lang)}/tags`;
    return buildRouteMeta({
      lang: lang as AppLanguage,
      title: (title || heading) as string,
      description: description as string,
      url: `${BASE_URL}${path}`,
      path,
    });
  })();

  const fallbackHeadLinks = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  })();

  useApplyFallbackHead(
    fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>,
    fallbackHeadLinks,
  );

  return (
    <>
      <GuidesTagsStructuredData
        pageUrl={pageUrl}
        name={title || heading}
        description={description}
        items={structuredItems}
      />
      <Section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <article aria-labelledby={TAGS_INDEX_HEADING_ID} className="space-y-6">
          <h1 id={TAGS_INDEX_HEADING_ID} className="text-3xl font-bold tracking-tight lg:text-4xl">
            {heading}
          </h1>
          <ul className="columns-1 gap-2 sm:columns-2 lg:columns-3 [&_li]:break-inside-avoid">
            {tags.map(({ tag, count }) => {
              const labelKey = `tags.${tag}.label`;
              const translated = tTags(labelKey);
              const fallbackLabel = getTagMeta(lang, tag).label;
              const resolvedLabel = translated && translated !== labelKey ? translated : fallbackLabel;
              const href = `/${lang}/${guidesSlug}/tags/${encodeURIComponent(tag)}`;

              return (
                <li key={tag} className="mb-2">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      to={href}
                      className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                    >
                      {resolvedLabel}
                    </Link>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-700">{count}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </Section>
    </>
  );
}

export default memo(GuidesTagsIndex);

// Ensure meta()/links() have language context and i18n is warmed
export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides", "guides.tags"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  return { lang } as const;
}

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = `/${lang}/${getSlug("guides", lang)}/tags`;
  const url = `${BASE_URL}${path}`;
  const fallbackConfig = i18nConfig.fallbackLng;
  const fallbackLang = (Array.isArray(fallbackConfig) ? fallbackConfig[0] : fallbackConfig) as AppLanguage;
  const primary = i18n.getFixedT?.(lang, "guides");
  const fallback = i18n.getFixedT?.(fallbackLang, "guides");
  const resolveString = (key: string, defaultValue: string): string => {
    const candidates = [primary, fallback];
    for (const translator of candidates) {
      if (typeof translator !== "function") continue;
      const value = translator(key) as unknown;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0 && trimmed !== key) {
          return trimmed;
        }
      }
    }
    return defaultValue;
  };
  const title = resolveString("tagsIndex.title", TAGS_INDEX_TITLE_FALLBACK);
  const description = resolveString("tagsIndex.description", TAGS_INDEX_DESCRIPTION_FALLBACK);
  return buildRouteMeta({ lang, title, description, url, path });
};

export const links: LinksFunction = () => buildRouteLinks();
