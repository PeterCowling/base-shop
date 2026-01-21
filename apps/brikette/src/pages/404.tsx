import type { LinkDescriptor, MetaDescriptor } from "react-router";
import type { GetStaticProps } from "next";

import type { ResolvedMatch } from "@/compat/route-runtime";
import { resolveRoute } from "@/compat/route-runtime";
import AppLayout from "@/components/layout/AppLayout";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import {
  resolveGuideContentKeysForMatches,
  resolveGuideLabelKeysForMatches,
  resolveNamespacesForMatches,
} from "@/next/i18nNamespaceSelector";
import { collectI18nResources, type I18nResourcesPayload } from "@/next/i18nResources";
import RouteHead from "@/next/RouteHead";
import RouteTree from "@/next/RouteTree";

type PageProps = {
  matches: ResolvedMatch[];
  head: { meta: MetaDescriptor[]; links: LinkDescriptor[] };
  params: Record<string, string | undefined>;
  i18n: I18nResourcesPayload;
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const fallback = i18nConfig.fallbackLng as AppLanguage;
  const resolved = await resolveRoute(`/${fallback}/404`);

  if ("redirect" in resolved) {
    return { redirect: resolved.redirect };
  }

  if ("notFound" in resolved) {
    return { notFound: true };
  }

  const resolvedLang =
    (resolved.result.params["lang"] as AppLanguage | undefined) ?? fallback;
  const namespaces = resolveNamespacesForMatches(resolved.result.matches);
  const guideContentKeys = resolveGuideContentKeysForMatches(resolved.result.matches);
  const guideLabelKeys = resolveGuideLabelKeysForMatches(resolved.result.matches, resolvedLang);
  const i18nResources = collectI18nResources(resolvedLang, namespaces, {
    guideContentKeys,
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
};

const NotFoundPage = ({ matches, head, params }: PageProps): JSX.Element => {
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

export default NotFoundPage;
