import type { ComponentType } from "react";
import type { LinkDescriptor, LinksFunction, MetaDescriptor, MetaFunction } from "react-router";
import type { GetStaticPaths, GetStaticProps } from "next";

import type { ResolvedMatch } from "@/compat/route-runtime";
import { resolveRoute } from "@/compat/route-runtime";
import type { LoaderFunctionArgs } from "@/compat/router-state";
import { RouteDataProvider } from "@/compat/router-state";
import AppLayout from "@/components/layout/AppLayout";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import {
  resolveGuideContentKeysForMatches,
  resolveGuideLabelKeysForMatches,
  resolveGuideLabelKeysForRouteFile,
  resolveGuideSummaryKeysForMatches,
  resolveGuideSummaryKeysForRouteFile,
  resolveNamespacesForMatches,
  resolveNamespacesForSectionKey,
} from "@/next/i18nNamespaceSelector";
import { collectI18nResources, type I18nResourcesPayload } from "@/next/i18nResources";
import RouteHead from "@/next/RouteHead";
import RouteTree from "@/next/RouteTree";
import DealsRoute, {
  clientLoader as dealsLoader,
  links as dealsLinks,
  meta as dealsMeta,
} from "@/routes/deals";
import ExperiencesRoute, {
  clientLoader as experiencesLoader,
  links as experiencesLinks,
  meta as experiencesMeta,
} from "@/routes/experiences";
import HowToGetHereRoute, {
  clientLoader as howToGetHereLoader,
  links as howToGetHereLinks,
  meta as howToGetHereMeta,
} from "@/routes/how-to-get-here";
import RoomsRoute, {
  clientLoader as roomsLoader,
  links as roomsLinks,
  meta as roomsMeta,
} from "@/routes/rooms";
import { getSlug } from "@/utils/slug";

const SECTION_KEYS = ["experiences", "howToGetHere", "rooms", "deals"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

type RouteConfig = {
  Component: ComponentType;
  loader: (args: LoaderFunctionArgs) => Promise<unknown>;
  meta: MetaFunction;
  links: LinksFunction;
};

const ROUTES_BY_KEY: Record<SectionKey, RouteConfig> = {
  experiences: {
    Component: ExperiencesRoute,
    loader: experiencesLoader,
    meta: experiencesMeta,
    links: experiencesLinks,
  },
  howToGetHere: {
    Component: HowToGetHereRoute,
    loader: howToGetHereLoader,
    meta: howToGetHereMeta,
    links: howToGetHereLinks,
  },
  rooms: {
    Component: RoomsRoute,
    loader: roomsLoader,
    meta: roomsMeta,
    links: roomsLinks,
  },
  deals: {
    Component: DealsRoute,
    loader: dealsLoader,
    meta: dealsMeta,
    links: dealsLinks,
  },
};

type SectionPagePropsBase = {
  head: { meta: MetaDescriptor[]; links: LinkDescriptor[] };
  params: Record<string, string | undefined>;
  i18n: I18nResourcesPayload;
};

type SectionPageRouteProps = SectionPagePropsBase & {
  sectionKey: SectionKey;
  loaderData: unknown;
};

type SectionPageResolvedProps = SectionPagePropsBase & {
  matches: ResolvedMatch[];
};

type SectionPageProps = SectionPageRouteProps | SectionPageResolvedProps;

const buildRequest = (pathname: string): Request => {
  const base = BASE_URL || "http://localhost";
  const url = new URL(pathname, base);
  return new Request(url.toString());
};

const resolveSectionKey = (lang: AppLanguage, slug: string): SectionKey | null => {
  const normalized = slug.trim().toLowerCase();
  for (const key of SECTION_KEYS) {
    if (getSlug(key, lang) === normalized) return key;
  }
  return null;
};

export const getStaticPaths: GetStaticPaths = async () => {
  // App Router owns these section routes; legacy page kept for parity.
  return { paths: [], fallback: false };
};

export const getStaticProps: GetStaticProps<SectionPageProps> = async ({ params }) => {
  const langParam = (params?.["lang"] as string | undefined) ?? "";
  const sectionParam = (params?.["section"] as string | undefined) ?? "";
  const supported = (i18nConfig.supportedLngs ?? []) as readonly string[];
  if (!supported.includes(langParam)) {
    return { notFound: true };
  }

  const lang = langParam as AppLanguage;
  const sectionKey = resolveSectionKey(lang, sectionParam);
  if (!sectionKey) {
    const pathname = `/${lang}/${sectionParam}`;
    const resolved = await resolveRoute(pathname);

    if ("redirect" in resolved) {
      return { redirect: resolved.redirect };
    }

    if ("notFound" in resolved) {
      return { notFound: true };
    }

    const resolvedLang =
      (resolved.result.params["lang"] as AppLanguage | undefined) ??
      (i18nConfig.fallbackLng as AppLanguage);
    const namespaces = resolveNamespacesForMatches(resolved.result.matches);
    const guideContentKeys = resolveGuideContentKeysForMatches(resolved.result.matches);
    const guideSummaryKeys = resolveGuideSummaryKeysForMatches(resolved.result.matches, resolvedLang);
    const guideLabelKeys = resolveGuideLabelKeysForMatches(resolved.result.matches, resolvedLang);
    const i18nResources = collectI18nResources(resolvedLang, namespaces, {
      guideContentKeys,
      guideSummaryKeys,
      ...(guideLabelKeys !== undefined ? { guideLabelKeys } : {}),
    });

    return {
      props: {
        matches: resolved.result.matches,
        head: resolved.result.head,
        params: resolved.result.params,
        i18n: i18nResources,
      },
    };
  }

  const route = ROUTES_BY_KEY[sectionKey];
  const pathname = `/${lang}/${sectionParam}`;
  const loaderData = await route.loader({
    request: buildRequest(pathname),
    params: { lang },
  } as LoaderFunctionArgs);

  const headMeta = route.meta({ data: loaderData }) ?? [];
  const headLinks = route.links({ data: loaderData }) ?? [];
  const namespaces = resolveNamespacesForSectionKey(sectionKey);
  const guideSummaryKeys =
    sectionKey === "experiences"
      ? resolveGuideSummaryKeysForRouteFile("routes/experiences.tsx", lang)
      : [];
  const labelRouteFile =
    sectionKey === "howToGetHere" ? "routes/how-to-get-here.tsx" : `routes/${sectionKey}.tsx`;
  const guideLabelKeys = resolveGuideLabelKeysForRouteFile(labelRouteFile, lang);
  const i18nResources = collectI18nResources(lang, namespaces, {
    guideSummaryKeys,
    ...(guideLabelKeys !== undefined ? { guideLabelKeys } : {}),
  });

  return {
    props: {
      sectionKey,
      loaderData,
      params: { lang, section: sectionParam },
      head: { meta: headMeta, links: headLinks },
      i18n: i18nResources,
    },
  };
};

export default function SectionPage(props: SectionPageProps): JSX.Element {
  if ("matches" in props) {
    const resolvedProps = props;
    const lang =
      (resolvedProps.params["lang"] as AppLanguage | undefined) ??
      (i18nConfig.fallbackLng as AppLanguage);

    return (
      <AppLayout lang={lang}>
        <RouteHead meta={resolvedProps.head.meta ?? []} links={resolvedProps.head.links} />
        <RouteTree matches={resolvedProps.matches} />
      </AppLayout>
    );
  }

  const routeProps = props;
  const route = ROUTES_BY_KEY[routeProps.sectionKey];
  const lang =
    (routeProps.loaderData as { lang?: AppLanguage })?.lang ??
    (routeProps.params["lang"] as AppLanguage | undefined) ??
    (i18nConfig.fallbackLng as AppLanguage);

  if (!route) {
    return (
      <AppLayout lang={lang}>
        <RouteHead meta={routeProps.head?.meta ?? []} links={routeProps.head?.links} />
      </AppLayout>
    );
  }

  const { Component } = route;

  return (
    <AppLayout lang={lang}>
      <RouteHead meta={routeProps.head.meta ?? []} links={routeProps.head.links} />
      <RouteDataProvider id={routeProps.sectionKey} data={routeProps.loaderData}>
        <Component />
      </RouteDataProvider>
    </AppLayout>
  );
}
