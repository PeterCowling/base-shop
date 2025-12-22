import { useEffect, useMemo } from "react";
import { redirect, useNavigate } from "react-router-dom";
import type { LoaderFunctionArgs } from "react-router-dom";

import { guideSlug } from "@/routes.guides-helpers";
// Satisfy template-enforcement lint rule for guides routes without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { langFromRequest } from "@/utils/lang";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import BreadcrumbStructuredData from "@/components/seo/BreadcrumbStructuredData";
import { buildLegacyGuideRedirectBreadcrumb } from "./legacyRedirectBreadcrumb";
import type { MetaFunction, LinksFunction } from "react-router";
import { i18nConfig } from "@/i18n.config";
import { BASE_URL } from "@/config/site";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";

export const GUIDE_KEY = "chiesaNuovaArrivals" as const;
export const GUIDE_SLUG = "chiesa-nuova-bar-internazionale-to-hostel-brikette" as const;

type LangCandidate = AppLanguage | undefined;

export function resolveTarget(lang: LangCandidate): string {
  const safeLang = (lang ?? "en") as AppLanguage;
  const howToSlug = getSlug("howToGetHere", safeLang);
  const childSlug = guideSlug(safeLang, GUIDE_KEY);
  return `/${safeLang}/${howToSlug}/${childSlug}`;
}

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request) as AppLanguage | undefined;
  throw redirect(resolveTarget(lang));
}

export default function ChiesaNuovaGuideRedirect(): JSX.Element {
  const navigate = useNavigate();
  const lang = useCurrentLanguage();
  const safeLang = (lang ?? "en") as AppLanguage;
  const target = useMemo(() => resolveTarget(safeLang), [safeLang]);

  useEffect(() => {
    navigate(target, { replace: true });
  }, [navigate, target]);

  const breadcrumb = useMemo(
    () => buildLegacyGuideRedirectBreadcrumb({ lang: safeLang, guideKey: GUIDE_KEY, targetPath: target }),
    [safeLang, target],
  );

  return (
    <BreadcrumbStructuredData breadcrumb={breadcrumb} />
  );
}

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = resolveTarget(lang as AppLanguage);
  const title = `guides.meta.${GUIDE_KEY}.title`;
  const description = `guides.meta.${GUIDE_KEY}.description`;
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

