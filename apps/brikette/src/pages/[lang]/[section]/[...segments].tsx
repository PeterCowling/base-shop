import type { GetStaticPaths, GetStaticProps } from "next";

import type { LinkDescriptor, MetaDescriptor } from "react-router";
import type { ResolvedMatch } from "@/compat/route-runtime";
import { listLocalizedPaths, resolveRoute } from "@/compat/route-runtime";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import type { SlugKey } from "@/types/slugs";
import AppLayout from "@/components/layout/AppLayout";
import RouteHead from "@/next/RouteHead";
import RouteTree from "@/next/RouteTree";
import { collectI18nResources, type I18nResourcesPayload } from "@/next/i18nResources";

type PageProps = {
  matches: ResolvedMatch[];
  head: { meta: MetaDescriptor[]; links: LinkDescriptor[] };
  params: Record<string, string | undefined>;
  i18n: I18nResourcesPayload;
};

const SECTION_KEYS: SlugKey[] = ["experiences", "howToGetHere", "rooms", "deals"];

const normalize = (value: string): string => {
  if (value.length > 1 && value.endsWith("/")) return value.slice(0, -1);
  return value;
};

const buildPathFromParams = (
  lang: string,
  section: string,
  segments?: string[] | string
): string => {
  const parts = [
    lang,
    section,
    ...(Array.isArray(segments) ? segments : segments ? [segments] : []),
  ].filter(Boolean);
  return `/${parts.join("/")}`;
};

const getSectionSlugs = (lang: string): Set<string> =>
  new Set(SECTION_KEYS.map((key) => getSlug(key, lang as AppLanguage)));

export const getStaticPaths: GetStaticPaths = async () => {
  const supported = (i18nConfig.supportedLngs ?? []) as string[];

  const paths = listLocalizedPaths()
    .map(normalize)
    .filter((path) => {
      const parts = path.replace(/^\/+/, "").split("/").filter(Boolean);
      if (parts.length < 3) return false;
      const [lang, section] = parts;
      if (!lang || !section || !supported.includes(lang)) return false;
      return getSectionSlugs(lang).has(section);
    })
    .map((path) => {
      const parts = path.replace(/^\/+/, "").split("/").filter(Boolean);
      const lang = parts.shift() ?? "";
      const section = parts.shift() ?? "";
      return {
        params: {
          lang,
          section,
          segments: parts.length > 0 ? parts : undefined,
        },
      };
    });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const lang = (params?.["lang"] as string | undefined) ?? "";
  const section = (params?.["section"] as string | undefined) ?? "";
  const segments = params?.["segments"] as string[] | string | undefined;
  const pathname = buildPathFromParams(lang, section, segments);

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
  const i18nResources = collectI18nResources(resolvedLang);

  return {
    props: {
      matches: resolved.result.matches,
      head: resolved.result.head,
      params: resolved.result.params,
      i18n: i18nResources,
    },
  };
};

export default function SectionCatchAll({ matches, head, params }: PageProps): JSX.Element {
  const lang = (params["lang"] as AppLanguage | undefined) ?? (i18nConfig.fallbackLng as AppLanguage);

  return (
    <AppLayout lang={lang}>
      <RouteHead meta={head.meta} links={head.links} />
      <RouteTree matches={matches} />
    </AppLayout>
  );
}
