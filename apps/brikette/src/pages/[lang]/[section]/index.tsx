import type { GetStaticPaths, GetStaticProps } from "next";
import type { ComponentType } from "react";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { BASE_URL } from "@/config/site";
import type { LoaderFunctionArgs } from "@/compat/router-state";
import { RouteDataProvider } from "@/compat/router-state";
import AppLayout from "@/components/layout/AppLayout";
import RouteHead from "@/next/RouteHead";
import { collectI18nResources, type I18nResourcesPayload } from "@/next/i18nResources";
import { getSlug } from "@/utils/slug";

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
import DealsRoute, {
  clientLoader as dealsLoader,
  links as dealsLinks,
  meta as dealsMeta,
} from "@/routes/deals";

const SECTION_KEYS = ["experiences", "howToGetHere", "rooms", "deals"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

type RouteConfig = {
  Component: ComponentType;
  loader: (args: LoaderFunctionArgs) => Promise<unknown>;
  meta: (args: { data?: unknown }) => ReturnType<typeof experiencesMeta>;
  links: (args: { data?: unknown }) => ReturnType<typeof experiencesLinks>;
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

type SectionPageProps = {
  sectionKey: SectionKey;
  loaderData: unknown;
  params: { lang: AppLanguage; section: string };
  head: { meta: ReturnType<typeof experiencesMeta>; links: ReturnType<typeof experiencesLinks> };
  i18n: I18nResourcesPayload;
};

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
  const langs = (i18nConfig.supportedLngs ?? []) as AppLanguage[];
  const paths = langs.flatMap((lang) =>
    SECTION_KEYS.map((key) => ({
      params: { lang, section: getSlug(key, lang) },
    })),
  );
  return { paths, fallback: false };
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
    return { notFound: true };
  }

  const route = ROUTES_BY_KEY[sectionKey];
  const pathname = `/${lang}/${sectionParam}`;
  const loaderData = await route.loader({
    request: buildRequest(pathname),
    params: { lang },
  } as LoaderFunctionArgs);

  const headMeta = route.meta({ data: loaderData });
  const headLinks = route.links({ data: loaderData });
  const i18nResources = collectI18nResources(lang);

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

export default function SectionPage({ sectionKey, loaderData, head, params }: SectionPageProps): JSX.Element {
  const { Component } = ROUTES_BY_KEY[sectionKey];
  const lang = (loaderData as { lang?: AppLanguage })?.lang ?? params.lang;

  return (
    <AppLayout lang={lang}>
      <RouteHead meta={head.meta ?? []} links={head.links} />
      <RouteDataProvider id={sectionKey} data={loaderData}>
        <Component />
      </RouteDataProvider>
    </AppLayout>
  );
}
