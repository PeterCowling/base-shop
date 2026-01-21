import type { LinksFunction,MetaFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import enAssistanceSection from "@/locales/en/assistanceSection.json";
import { OG_IMAGE } from "@/utils/headConstants";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { resolveCanonicalAssistancePath } from "./assistance/resolveCanonicalPath";

export { default } from "./assistance/assistance-route";
export type { AssistanceLoaderData } from "./assistance/client-loader";
export { clientLoader } from "./assistance/client-loader";
export { ASSISTANCE_HUB_TEST_IDS } from "./assistance/constants";

export const meta: MetaFunction = ({ data, location }) => {
  const d = (data || {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const title = (() => {
    const raw = (d.title || "").trim();
    if (raw.length > 0) return raw;
    type AssistanceLocale = { meta?: { title?: unknown; description?: unknown } };
    const en = (enAssistanceSection as AssistanceLocale)?.meta?.title;
    return typeof en === "string" ? en : "";
  })();
  const description = (() => {
    const raw = (d.desc || "").trim();
    if (raw.length > 0) return raw;
    type AssistanceLocale = { meta?: { title?: unknown; description?: unknown } };
    const en = (enAssistanceSection as AssistanceLocale)?.meta?.description;
    return typeof en === "string" ? en : "";
  })();
  const fallbackPath = `/${lang}/${getSlug("assistance", lang)}`;
  const path = resolveCanonicalAssistancePath({
    fallbackPath,
    locationPathname: location?.pathname ?? null,
  });
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
  });
};

export const links: LinksFunction = () => buildRouteLinks();
