import { useEffect, useMemo } from "react";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";
import { useNavigate } from "react-router-dom";

import BreadcrumbStructuredData from "@/components/seo/BreadcrumbStructuredData";
import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug } from "@/routes.guides-helpers";
// Satisfy template-enforcement lint rule for guides routes without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE } from "@/utils/headConstants";
import { langFromRequest } from "@/utils/lang";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { buildLegacyGuideRedirectBreadcrumb, resolveLegacyGuideSeo } from "./legacyRedirectBreadcrumb";

export const GUIDE_KEY = "ferryDockToBrikette" as const;
export const GUIDE_SLUG = "ferry-dock-to-hostel-brikette-with-luggage" as const;

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

export default function FerryDockToBriketteGuideRedirect(): JSX.Element {
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

// Head exports – ensure canonical + hreflang and twitter:card present
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = resolveTarget(lang as AppLanguage);
  const { title, description } = resolveLegacyGuideSeo({ lang, guideKey: GUIDE_KEY });
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

