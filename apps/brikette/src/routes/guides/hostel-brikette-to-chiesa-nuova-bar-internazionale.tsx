import { useEffect, useMemo } from "react";
import { redirect, useNavigate } from "react-router-dom";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { MetaFunction, LinksFunction } from "react-router";

import { guideSlug } from "@/routes.guides-helpers";
import "@/routes/guides/_GuideSeoTemplate";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { langFromRequest } from "@/utils/lang";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import BreadcrumbStructuredData from "@/components/seo/BreadcrumbStructuredData";
import { buildLegacyGuideRedirectBreadcrumb } from "./legacyRedirectBreadcrumb";
import { resolveLegacyGuideSeo } from "./legacyRedirectBreadcrumb";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";

export const GUIDE_KEY = "chiesaNuovaDepartures" as const;
export const GUIDE_SLUG = "hostel-brikette-to-chiesa-nuova-bar-internazionale" as const;

type LangCandidate = AppLanguage | undefined;

function resolveTarget(lang: LangCandidate): string {
  const safeLang = (lang ?? "en") as AppLanguage;
  const howToSlug = getSlug("howToGetHere", safeLang);
  const childSlug = guideSlug(safeLang, GUIDE_KEY);
  return `/${safeLang}/${howToSlug}/${childSlug}`;
}

export const __test__ = { resolveTarget } as const;

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request) as AppLanguage | undefined;
  throw redirect(resolveTarget(lang));
}

export default function ChiesaNuovaDepartureGuideRedirect(): JSX.Element {
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
    <BreadcrumbStructuredData
      lang={safeLang}
      items={breadcrumb.itemListElement.map((e) => ({ name: e.name, item: e.item }))}
    />
  );
}

// Head exports – ensure canonical + hreflang and twitter:card present
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

