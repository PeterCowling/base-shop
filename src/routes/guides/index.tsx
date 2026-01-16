import type { LinksFunction, MetaFunction } from "react-router";

import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import { buildRouteLinks, buildRouteMeta, resolveMetaLangs } from "@/utils/routeHead";

export { experiencesClientLoader as clientLoader } from "../experiences/clientLoader";
export { default } from "../experiences/ExperiencesPage";

export const meta: MetaFunction = (args) => {
  const d = (((args as { data?: unknown }).data) || {}) as {
    lang?: AppLanguage;
    title?: string;
    desc?: string;
  };
  const { lang, pathLang, metaFromLoader } = resolveMetaLangs(args, d);
  const title = metaFromLoader.title || "";
  const description = metaFromLoader.description || "";
  const path = `/${pathLang}/${getSlug("guides", pathLang)}`;
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
  });
};

export const links: LinksFunction = () => buildRouteLinks();