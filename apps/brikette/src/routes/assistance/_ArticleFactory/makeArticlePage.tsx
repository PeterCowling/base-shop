// src/routes/assistance/_ArticleFactory/makeArticlePage.tsx
import { FC, memo, useEffect, useMemo, useRef, type ReactNode, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import * as Router from "react-router-dom";

import ArticleSection from "@acme/ui/organisms/AssistanceArticleSection";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug } from "@/routes.guides-helpers";
import { articleSlug, type HelpArticleKey } from "@/routes.assistance-helpers";
import { getSlug } from "@/utils/slug";
import { safeUseLoaderData } from "@/utils/safeUseLoaderData";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { Section } from "@acme/ui/atoms/Section";
import RelatedGuides, { type RelatedItem } from "@/components/guides/RelatedGuides";
import i18n from "@/i18n";
import { BASE_URL } from "@/config/site";
import { resolveCanonicalAssistancePath } from "../resolveCanonicalPath";

import type { AppLanguage } from "@/i18n.config";
import { DEFAULT_TWITTER_CARD, OG_IMAGE_DIMENSIONS, OG_IMAGE_TRANSFORM } from "./constants";
import { normaliseMeta, resolveMeta } from "./metaUtils";
import type { AssistanceArticleLoaderData } from "./types";

type LocationLike = { pathname?: string };

const META_DESCRIPTION_SELECTOR = 'meta[name="description"]'; // i18n-exempt -- TECH-000 [ttl=2026-12-31] DOM selector; not user-facing copy

const getRouterUseLocation = (): (() => LocationLike) | undefined => {
  try {
    const hook = (Router as { useLocation?: () => LocationLike }).useLocation;
    return typeof hook === "function" ? hook : undefined;
  } catch {
    return undefined;
  }
};

const useSafeLocation = (): LocationLike => {
  const hook = getRouterUseLocation();
  if (hook) {
    try {
      return hook();
    } catch {
      /* ignore missing router context in tests */
    }
  }
  if (typeof window !== "undefined" && typeof window.location?.pathname === "string") {
    const { pathname } = window.location;
    if (pathname && pathname !== "/") return { pathname };
  }
  return {};
};

export function makeArticlePage(namespace: string, extraProps: Record<string, unknown> = {}): FC {
  const ArticlePage: FC = () => {
    const loaderData = safeUseLoaderData<AssistanceArticleLoaderData | undefined>();
    const langFromLoader = loaderData?.lang;
    const currentLanguage = useCurrentLanguage();
    const lang = langFromLoader ?? currentLanguage;
    const { t: tNamespace, ready } = useTranslation(namespace, { lng: lang });
    const { t: tGuides } = useTranslation("guides", { lng: lang });
    const guidesEnT = useMemo<TFunction>(
      () => i18n.getFixedT("en", "guides") as TFunction,
      [],
    );
    const resolveGuideLabel = (key: string): string => {
      const current = tGuides(key, { defaultValue: key }) as unknown;
      const currentText = typeof current === "string" ? current.trim() : "";
      if (currentText && currentText !== key) return currentText;
      const fallback = guidesEnT(key, { defaultValue: key }) as unknown;
      const fallbackText = typeof fallback === "string" ? fallback.trim() : "";
      return fallbackText && fallbackText !== key ? fallbackText : key;
    };
    const locationPathname = useSafeLocation()?.pathname;

    // Localised SEO meta
    const hookMetaTitle = useMemo(
      () => (ready ? normaliseMeta(tNamespace("meta.title"), "meta.title") : undefined),
      [tNamespace, ready],
    );
    const hookMetaDescription = useMemo(
      () => (ready ? normaliseMeta(tNamespace("meta.description"), "meta.description") : undefined),
      [tNamespace, ready],
    );
    const fallbackTitle = useMemo(
      () => hookMetaTitle ?? resolveMeta(lang, namespace, "meta.title"),
      [hookMetaTitle, lang],
    );
    const fallbackDescription = useMemo(
      () => hookMetaDescription ?? resolveMeta(lang, namespace, "meta.description"),
      [hookMetaDescription, lang],
    );
    const title = loaderData?.title || fallbackTitle;
    const description = loaderData?.description || fallbackDescription;

    const previousTitleRef = useRef<string | null>(null);
    const previousMetaDescriptionRef = useRef<string | null>(null);
    const createdMetaTagRef = useRef<boolean>(false);

    // In tests (MemoryRouter), inject deterministic head tags mirroring meta()/links().
    const { t: tTranslation } = useTranslation("translation", { lng: lang });

    const fallbackHeadDescriptors = useMemo(() => {
      if (process.env.NODE_ENV !== "test") return undefined;
      const fallbackPath = `/${lang}/${getSlug("assistance", lang)}/${articleSlug(lang, namespace as HelpArticleKey)}`;
      const path = resolveCanonicalAssistancePath({
        fallbackPath,
        locationPathname: locationPathname ?? null,
      });
      const url = `${BASE_URL}${path}`;
      const image = buildCfImageUrl("/img/positano-panorama.avif", OG_IMAGE_TRANSFORM);
      const rawCard = (tTranslation("meta.twitterCard") as string) || "";
      const twitterCard = rawCard.trim() || String(DEFAULT_TWITTER_CARD);
      return buildRouteMeta({
        lang,
        title,
        description,
        url,
        path,
        image: { src: image, width: OG_IMAGE_DIMENSIONS.width, height: OG_IMAGE_DIMENSIONS.height },
        twitterCard,
        includeTwitterUrl: true,
        ogType: "article",
      });
    }, [description, lang, title, tTranslation, locationPathname]);

    const fallbackHeadLinks = useMemo(() => {
      if (process.env.NODE_ENV !== "test") return undefined;
      const fallbackPath = `/${lang}/${getSlug("assistance", lang)}/${articleSlug(lang, namespace as HelpArticleKey)}`;
      const path = resolveCanonicalAssistancePath({
        fallbackPath,
        locationPathname: locationPathname ?? null,
      });
      return buildRouteLinks({ lang, path });
    }, [lang, locationPathname]);

    useApplyFallbackHead(fallbackHeadDescriptors, fallbackHeadLinks);

    const shouldUpdateDocumentTitle = Boolean(title);

    if (previousTitleRef.current === null && typeof document !== "undefined") {
      previousTitleRef.current = document.title;
    }

    useEffect(() => {
      if (!shouldUpdateDocumentTitle || !title) return;
      document.title = title;
    }, [shouldUpdateDocumentTitle, title]);

    // Keep <meta name="description"> in sync with resolved description.
    useEffect(() => {
      if (typeof document === "undefined") return;

      const head = document.head || document.getElementsByTagName("head")[0];
      if (!head) return;

      let tag = head.querySelector(META_DESCRIPTION_SELECTOR) as HTMLMetaElement | null;

      if (description && description.trim()) {
        if (!previousMetaDescriptionRef.current) {
          previousMetaDescriptionRef.current = tag?.getAttribute("content") ?? null;
        }

        if (!tag) {
          tag = document.createElement("meta");
          tag.setAttribute("name", "description");
          createdMetaTagRef.current = true;
          head.appendChild(tag);
        }
        tag.setAttribute("content", description);
      } else {
        if (tag) {
          if (createdMetaTagRef.current) {
            head.removeChild(tag);
            createdMetaTagRef.current = false;
          } else if (previousMetaDescriptionRef.current !== null) {
            tag.setAttribute("content", previousMetaDescriptionRef.current);
          }
        }
      }
    }, [description]);

    useEffect(() => {
      return () => {
        if (typeof document !== "undefined") {
          if (previousTitleRef.current !== null) {
            document.title = previousTitleRef.current;
          }
          const head = document.head || document.getElementsByTagName("head")[0];
          const tag = head?.querySelector(META_DESCRIPTION_SELECTOR) as HTMLMetaElement | null;
          if (tag) {
            if (createdMetaTagRef.current) {
              head!.removeChild(tag);
            } else if (previousMetaDescriptionRef.current !== null) {
              tag.setAttribute("content", previousMetaDescriptionRef.current);
            }
          }
        }
      };
    }, []);

    useEffect(() => {
      if (shouldUpdateDocumentTitle) return;
      if (previousTitleRef.current !== null && typeof document !== "undefined") {
        document.title = previousTitleRef.current;
      }
    }, [shouldUpdateDocumentTitle]);

    type SlotCtx = { lang: AppLanguage; title: string; description: string; namespace: string };
    type ArticlePropsFn = (ctx: SlotCtx & { tNs: TFunction }) => Record<string, unknown>;
    type AfterArticleFn = (ctx: SlotCtx) => ReactNode;

    const { additionalScripts, relatedGuides, alsoSeeGuides, suppressDefaultAlsoSee } = (extraProps || {}) as {
      additionalScripts?: ReactNode | ((ctx: SlotCtx) => ReactNode);
      relatedGuides?: ({ items: RelatedItem[] } & Partial<ComponentProps<typeof RelatedGuides>>) | undefined;
      alsoSeeGuides?: ({ items: RelatedItem[] } & Partial<ComponentProps<typeof RelatedGuides>>) | undefined;
      suppressDefaultAlsoSee?: boolean;
    };

    const slotCtx = useMemo(() => ({ lang, title, description, namespace }), [description, lang, title]);

    const resolvedArticleProps = useMemo(() => {
      const maybe = (extraProps as { articleProps?: ArticlePropsFn }).articleProps;
      if (typeof maybe === "function") {
        return maybe({ lang, title, description, namespace, tNs: tNamespace });
      }
      return extraProps;
    }, [description, lang, tNamespace, title]);

    const articleSectionProps = useMemo(() => {
      const supported = new Set(["media"]);
      const out: Record<string, unknown> = {};
      Object.entries(resolvedArticleProps || {}).forEach(([k, v]) => {
        if (supported.has(k)) out[k] = v;
      });
      return out;
    }, [resolvedArticleProps]);

    return (
      <>
        {null}
        {typeof additionalScripts === "function" ? additionalScripts(slotCtx) : additionalScripts || null}
        <ArticleSection lang={lang} namespace={namespace} {...articleSectionProps} />

        {relatedGuides && Array.isArray(relatedGuides.items) && relatedGuides.items.length > 0 ? (
          <Section padding="none" className="mx-auto mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
            <RelatedGuides
              lang={lang}
              title={resolveGuideLabel("labels.relatedGuides")}
              {...relatedGuides}
            />
          </Section>
        ) : null}

        {suppressDefaultAlsoSee ? null : (
          <Section padding="none" className="mx-auto mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
              {resolveGuideLabel("labels.alsoSee")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              <li>
                <Router.Link
                  to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "backpackerItineraries")}`}
                  className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
                >
                  {resolveGuideLabel("content.backpackerItineraries.linkLabel")}
                </Router.Link>
              </li>
              <li>
                <Router.Link
                  to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "onlyHostel")}`}
                  className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
                >
                  {resolveGuideLabel("content.onlyHostel.linkLabel")}
                </Router.Link>
              </li>
            </ul>
          </Section>
        )}

        {alsoSeeGuides && Array.isArray(alsoSeeGuides.items) && alsoSeeGuides.items.length > 0 ? (
          <Section padding="none" className="mx-auto mt-6 max-w-4xl px-4 sm:px-6 lg:px-8">
            <RelatedGuides lang={lang} title={resolveGuideLabel("labels.alsoSee")} {...alsoSeeGuides} />
          </Section>
        ) : null}

        {typeof (extraProps as { afterArticle?: AfterArticleFn })?.afterArticle === "function"
          ? (extraProps as { afterArticle?: AfterArticleFn }).afterArticle?.(slotCtx)
          : null}
      </>
    );
  };

  ArticlePage.displayName = `${namespace}-ArticlePage`;
  return memo(ArticlePage);
}
