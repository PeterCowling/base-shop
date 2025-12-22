import { useEffect, useMemo } from "react";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { useNavigate } from "react-router-dom";
import type { MetaFunction, LinksFunction } from "react-router";

import ArticleStructuredData from "@/components/seo/ArticleStructuredData";
import BreadcrumbStructuredData, { type BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";
import { guideSlug } from "@/routes.guides-helpers";
import "@/routes/guides/_GuideSeoTemplate";
import { langFromRequest } from "@/utils/lang";
import { getSlug } from "@/utils/slug";

import { buildLegacyGuideRedirectBreadcrumb, resolveLegacyGuideSeo } from "./legacyRedirectBreadcrumb";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";

export const GUIDE_KEY = "briketteToFerryDock" as const;
export const GUIDE_SLUG = "hostel-brikette-to-ferry-dock-with-luggage" as const;

type LangCandidate = AppLanguage | undefined;

function resolveTarget(lang: LangCandidate): string {
  const safeLang = (lang ?? "en") as AppLanguage;
  const howToSlug = getSlug("howToGetHere", safeLang);
  const childSlug = guideSlug(safeLang, GUIDE_KEY);
  return `/${safeLang}/${howToSlug}/${childSlug}`;
}

export const __test__ = { resolveTarget } as const;

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request) as LangCandidate;
  throw redirect(resolveTarget(lang));
}

export default function HostelBriketteToFerryDockGuideRedirect(): JSX.Element {
  const navigate = useNavigate();
  const lang = useCurrentLanguage();
  const safeLang = (lang ?? "en") as AppLanguage;
  const target = useMemo(() => resolveTarget(safeLang), [safeLang]);

  useEffect(() => {
    navigate(target, { replace: true });
  }, [navigate, target]);

  const { title, description } = useMemo(
    () => resolveLegacyGuideSeo({ lang: safeLang, guideKey: GUIDE_KEY }),
    [safeLang],
  );

  const breadcrumb = useMemo<BreadcrumbList>(
    () => buildLegacyGuideRedirectBreadcrumb({ lang: safeLang, guideKey: GUIDE_KEY, targetPath: target }),
    [safeLang, target],
  );

  return (
    <>
      <ArticleStructuredData headline={title} description={description} />
      <BreadcrumbStructuredData breadcrumb={breadcrumb} />
    </>
  );
}

// Head exports – reflect the canonical target of the redirect
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const lang = ((data as { lang?: string } | undefined)?.lang as AppLanguage) || ("en" as AppLanguage);
  const path = resolveTarget(lang);
  const url = `${BASE_URL}${path}`;
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
    url,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

