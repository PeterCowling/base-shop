// src/routes/not-found.tsx
// Route wrapper for 404/catch‑all. Defines head via shared helpers
// to satisfy route-level lint rules and re-exports the view/loader.

import type { LinksFunction,MetaFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";

import NotFound, { clientLoader } from "./NotFound";

export default NotFound;
export { clientLoader };

// Keep OG image consistent with the underlying view
const OG_IMAGE_SOURCE = "/img/positano-panorama.avif" as const;

export const meta: MetaFunction = (args) => {
  const d = ((args as { data?: { lang?: AppLanguage; title?: string; desc?: string } })?.data ??
    {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const title = d.title || "";
  const description = d.desc || "";
  const path = `/${lang}/404`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl(OG_IMAGE_SOURCE, {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  // 404 is not indexable
  return buildRouteMeta({
    lang,
    title,
    description,
    url,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    isPublished: false,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
