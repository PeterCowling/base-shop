import { Fragment, type JSX,memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { LinksFunction, MetaFunction } from "react-router";
import * as Router from "react-router-dom";
import type { TFunction } from "i18next";

import AlsoSeeGuidesSection from "@/components/assistance/AlsoSeeGuidesSection";
import ArrivingByFerrySection from "@/components/assistance/ArrivingByFerrySection";
import ArticleSection from "@/components/assistance/ArticleSection";
import AssistanceHero from "@/components/assistance/AssistanceHero";
import AssistanceQuickLinksSection from "@/components/assistance/quick-links-section";
import AlsoHelpful from "@/components/common/AlsoHelpful";
import GuideCollection from "@/components/guides/GuideCollection";
import FaqStructuredData from "@/components/seo/FaqStructuredData";
import ServiceStructuredData from "@/components/seo/ServiceStructuredData";
import { DOMAIN } from "@/config";
import { HelpDrawerProvider } from "@/context/HelpDrawerContext";
import { tagsForAssistance } from "@/data/assistance.tags";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { normaliseBrowserOrigin } from "@/utils/origin";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { safeUseLoaderData } from "@/utils/safeUseLoaderData";
import { getSlug } from "@/utils/slug";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";
import { translatePath } from "@/utils/translate-path";
import { getNamespaceTranslator } from "@/utils/translationFallbacks";

import { AssistanceHubLinks } from "./assistance-hub-links";
import { buildAssistanceOgImage } from "./build-og-image";
import type { AssistanceLoaderData } from "./client-loader";
import { PLANNING_GUIDES_SECTION_ID } from "./constants";
import HelpArticlesList from "./HelpArticlesList";
import PopularGuidesSection from "./PopularGuidesSection";
import { useAssistanceMedia } from "./use-assistance-media";
import { useEnglishAssistanceTranslators } from "./use-assistance-translators";
import { useGuideCollectionCopy } from "./use-guide-collection-copy";
import { useHelpGuides } from "./use-help-guides";
import { useCrosslinkCopy,useHubLinks } from "./use-hub-links";
import { useAssistanceLang } from "./use-lang";
import { useResolvedMeta } from "./use-meta";
import { resolveCurrentKey } from "./utils";

type LocationLike = { pathname?: string };

const resolveOrigin = (): string => {
  if (typeof window !== "undefined") {
    try {
      const raw = window?.location?.origin ?? "";
      if (raw) return normaliseBrowserOrigin(raw);
    } catch {
      /* ignore missing window */
    }
  }
  return DOMAIN;
};

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

type SearchParamsHook = ReturnType<NonNullable<typeof Router.useSearchParams>>;

const useSafeSearchParams = (): SearchParamsHook => {
  try {
    const hook = (Router as { useSearchParams?: () => SearchParamsHook }).useSearchParams;
    if (typeof hook === "function") {
      return hook();
    }
  } catch {
    /* ignore absent hook */
  }
  const params = new URLSearchParams();
  const setParams = () => {};
  return [params, setParams] as SearchParamsHook;
};

const AssistanceRoute = memo(function AssistanceRoute(): JSX.Element {
  const loaderData = safeUseLoaderData<AssistanceLoaderData | undefined>();
  const loaderLang = loaderData?.lang;
  const slug = loaderData?.slug;
  const loaderTitle = loaderData?.title;
  const loaderDesc = loaderData?.desc;
  const lang = useAssistanceLang(loaderLang);
  const locationPathname = useSafeLocation()?.pathname;

  const { t, i18n } = useTranslation("assistanceSection", { lng: lang });
  const { t: tCommon, i18n: i18nCommon } = useTranslation("assistanceCommon", { lng: lang });
  const { t: tGlobal } = useTranslation("translation", { lng: lang });
  const { t: tHowTo } = useTranslation("howToGetHere", { lng: lang });
  const { t: tExperiences } = useTranslation("experiencesPage", { lng: lang });
  useTranslation<"guides">("guides", { lng: lang });
  const [searchParams] = useSafeSearchParams();
  const filterTag = searchParams.get("tag");

  const { assistanceEnT, howToEnT, experiencesEnT } = useEnglishAssistanceTranslators();
  const tStable = useMemo(() => t as TFunction<"assistanceSection">, [t]);
  const tHowToStable = useMemo(() => tHowTo as TFunction, [tHowTo]);
  const tExperiencesStable = useMemo(() => tExperiences as TFunction, [tExperiences]);
  const tCommonStable = useMemo(() => tCommon as TFunction, [tCommon]);
  const tCommonEn = useMemo(
    () => getNamespaceTranslator(i18nCommon, "en", "assistanceCommon", tCommon),
    [i18nCommon, tCommon],
  );

  const resolvedMeta = useResolvedMeta(tStable, i18n, loaderTitle, loaderDesc);

  const helpGuides = useHelpGuides(lang);

  const { howToLink, experiencesLink } = useHubLinks({
    lang,
    tHowTo: tHowToStable,
    tExperiences: tExperiencesStable,
    howToEnT,
    experiencesEnT,
  });

  const { crosslinkHeading, crosslinkIntro } = useCrosslinkCopy({
    t: tStable,
    assistanceEnT,
    howToTitle: howToLink.title,
    experiencesTitle: experiencesLink.title,
    howToMetaDescription: howToLink.metaDescription ?? "",
    experiencesMetaDescription: experiencesLink.metaDescription ?? "",
  });

  const filterTagDisplay = filterTag ? `#${filterTag}` : undefined;
  const guideCollectionCopy = useGuideCollectionCopy({
    t: tStable,
    assistanceEnT,
    ...(filterTagDisplay ? { filterTagDisplay } : {}),
  });

  const currentKey = resolveCurrentKey(lang, slug);

  // Assistance media for articles
  const fallbackHeading = tStable("heading", { defaultValue: assistanceEnT("heading") }) as string;
  const media = useAssistanceMedia(tStable, fallbackHeading);

  let section: JSX.Element | null = null;
  if (slug) {
    if (currentKey === "arrivingByFerry") {
      section = <ArrivingByFerrySection lang={lang} />;
    } else {
      section = <ArticleSection lang={lang} namespace={currentKey} media={media} />;
    }
  }

  const assistanceKey = slug ? currentKey : undefined;

  const howToHubLink = howToLink;
  const experiencesHubLink = experiencesLink;

  // Guides translator handled inside AlsoSeeGuidesSection

  // Deterministic head fallback for tests
  const fallbackHeadDescriptors = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const metaFromLoader = {
      title: (loaderTitle ?? "").trim(),
      description: (loaderDesc ?? "").trim(),
    };
    // Prefer resolved meta (which already applies English fallbacks)
    const title = metaFromLoader.title || resolvedMeta.title;
    const description = metaFromLoader.description || resolvedMeta.description;
    const fallbackPathBase = `/${lang}/${getSlug("assistance", lang)}`;
    const fallbackPath = slug ? `${fallbackPathBase}/${slug}` : fallbackPathBase;
    const path =
      typeof locationPathname === "string" && locationPathname.startsWith("/") ? locationPathname : fallbackPath;
    const origin = resolveOrigin();
    return buildRouteMeta({
      lang,
      title,
      description,
      url: `${origin}${path}`,
      path,
      image: { src: buildAssistanceOgImage() },
    });
  }, [lang, loaderTitle, loaderDesc, resolvedMeta.title, resolvedMeta.description, slug, locationPathname]);

  const fallbackHeadLinks = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const fallbackPathBase = `/${lang}/${getSlug("assistance", lang)}`;
    const fallbackPath = slug ? `${fallbackPathBase}/${slug}` : fallbackPathBase;
    const path =
      typeof locationPathname === "string" && locationPathname.startsWith("/") ? locationPathname : fallbackPath;
    const origin = resolveOrigin();
    return buildRouteLinks({ lang, path, origin });
  }, [lang, slug, locationPathname]);

  useApplyFallbackHead(fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>, fallbackHeadLinks);

  return (
    <Fragment>
      {null}

      <FaqStructuredData />
      <ServiceStructuredData
        name={tStable("heading")}
        description={resolvedMeta.description}
        providerName={tGlobal("header.title")}
        inLanguage={lang}
      />

      <HelpDrawerProvider>
        <h1 className="sr-only">{tStable("heading")}</h1>
        {section}

        {null}

        {!slug ? <AssistanceHero lang={lang} /> : null}

        {!slug ? <AssistanceQuickLinksSection lang={lang} /> : null}

        <HelpArticlesList
          lang={lang}
          tSection={tStable}
          tCommon={tCommonStable}
          tCommonEn={tCommonEn as TFunction}
        />

        {!slug ? <PopularGuidesSection lang={lang} /> : null}

        <GuideCollection
          id={PLANNING_GUIDES_SECTION_ID}
          lang={lang}
          guides={helpGuides}
          filterTag={filterTag}
          clearFilterHref={`/${lang}/${translatePath("assistance", lang)}`}
          copy={guideCollectionCopy}
        />

        <AssistanceHubLinks
          heading={crosslinkHeading}
          howTo={howToHubLink}
          experiences={experiencesHubLink}
          {...(crosslinkIntro ? { intro: crosslinkIntro } : {})}
        />

        {!slug ? <AlsoSeeGuidesSection lang={lang} /> : null}

        <AlsoHelpful
          lang={lang}
          tags={tagsForAssistance(assistanceKey)}
          includeRooms
          section="help"
        />
      </HelpDrawerProvider>
    </Fragment>
  );
});

export default AssistanceRoute;

// Provide meta()/links() to satisfy head lint rules for files under routes/
export const meta: MetaFunction = ({ data, location }: { data?: unknown; location?: unknown } = {}) => {
  const d = (data || {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const fallbackPath = `/${lang}/${getSlug("assistance", lang)}`;
  const loc =
    typeof location === "object" && location !== null && "pathname" in (location as Record<string, unknown>)
      ? (location as { pathname?: unknown })
      : undefined;
  const rawPathname = typeof loc?.pathname === "string" ? loc.pathname : undefined;
  const path = rawPathname && rawPathname.startsWith("/") ? rawPathname : fallbackPath;
  const origin = resolveOrigin();
  const url = `${origin}${path}`;
  const metaFromLoader = {
    title: (d.title ?? "").trim(),
    description: (d.desc ?? "").trim(),
  };
  const fallbackMeta = resolveI18nMeta(lang, "assistanceSection");
  const title = metaFromLoader.title || fallbackMeta.title;
  const description = metaFromLoader.description || fallbackMeta.description;
  return buildRouteMeta({
    lang,
    title,
    description,
    url,
    path,
    image: { src: buildAssistanceOgImage() },
  });
};

export const links: LinksFunction = () => buildRouteLinks();
