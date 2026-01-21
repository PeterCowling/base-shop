import type { LinkDescriptor, MetaDescriptor } from "react-router";
import type { GetStaticPaths, GetStaticProps } from "next";

import type { ResolvedMatch } from "@/compat/route-runtime";
import { resolveRoute } from "@/compat/route-runtime";
import AppLayout from "@/components/layout/AppLayout";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { collectI18nResources, type I18nResourcesPayload } from "@/next/i18nResources";
import RouteHead from "@/next/RouteHead";
import RouteTree from "@/next/RouteTree";

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
  // All public routes are now handled by App Router.
  // This catch-all is disabled to avoid generating internal/draft paths.
  return { paths: [], fallback: false };
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
