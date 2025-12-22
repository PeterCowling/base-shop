import type { GetStaticPaths, GetStaticProps } from "next";

import { listLocalizedPaths, resolveRoute } from "@/compat/route-runtime";
import type { ResolvedMatch } from "@/compat/route-runtime";
import type { LinkDescriptor, MetaDescriptor } from "react-router";
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

const buildPathFromParams = (lang: string, segments?: string[] | string): string => {
  const parts = [lang, ...(Array.isArray(segments) ? segments : segments ? [segments] : [])].filter(Boolean);
  return `/${parts.join("/")}`;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const supported = (i18nConfig.supportedLngs ?? []) as string[];
  const excludedKeys: SlugKey[] = ["experiences", "howToGetHere", "rooms", "deals"];

  const normalize = (value: string): string => {
    if (value.length > 1 && value.endsWith("/")) return value.slice(0, -1);
    return value;
  };

  const isHandledByExplicitRoutes = (path: string): boolean => {
    const parts = path.replace(/^\/+/, "").split("/").filter(Boolean);
    const [lang, section] = parts;
    if (!lang || !supported.includes(lang)) return false;
    if (parts.length === 1) return true;
    const sectionSlugs = new Set<string>([
      ...excludedKeys.map((key) => getSlug(key, lang as AppLanguage)),
      getSlug("guides", lang as AppLanguage),
    ]);
    return section ? sectionSlugs.has(section) : false;
  };

  const paths = listLocalizedPaths()
    .map((path) => normalize(path))
    .filter((path) => !isHandledByExplicitRoutes(path))
    .map((path) => {
      const parts = path.replace(/^\/+/, "").split("/").filter(Boolean);
      const lang = parts.shift() ?? "";
      return {
        params: {
          lang,
          segments: parts.length > 0 ? parts : undefined,
        },
      };
    });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const lang = (params?.["lang"] as string | undefined) ?? "";
  const segments = params?.["segments"] as string[] | string | undefined;
  const pathname = buildPathFromParams(lang, segments);
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

const LocalizedCatchAllPage = ({ matches, head, params }: PageProps): JSX.Element => {
  const lang =
    (params["lang"] as AppLanguage | undefined) ??
    (i18nConfig.fallbackLng as AppLanguage);

  return (
    <AppLayout lang={lang}>
      <RouteHead meta={head.meta} links={head.links} />
      <RouteTree matches={matches} />
    </AppLayout>
  );
};

export default LocalizedCatchAllPage;
