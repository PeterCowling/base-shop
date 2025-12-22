/* src/routes/experiences.tsx */
import type { LinksFunction, MetaFunction } from "react-router";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

export { experiencesClientLoader as clientLoader } from "./experiences/clientLoader";
export { default } from "./experiences/ExperiencesPage";

export const meta: MetaFunction = (args) => {
  const d = (((args as { data?: unknown }).data) || {}) as {
    lang?: AppLanguage;
    title?: string;
    desc?: string;
  };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const title = d.title || "";
  const description = d.desc || "";
  const path = `/${lang}/${getSlug("experiences", lang)}`;
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

