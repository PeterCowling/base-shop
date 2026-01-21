// Internal manifest-only route component.
// This renders nothing and exists purely so we can attach
// stable `${lang}-guide-${key}` ids to the route manifest
// without publishing duplicate public pages.
import type * as React from "react";
import type { LinksFunction,MetaFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";

export default function ManifestSentinel(): React.ReactElement | null {
  return null;
}

// Minimal head exports to satisfy route-level SEO lint rules.
// Mark as unpublished so search engines ignore these internal paths.
export const meta: MetaFunction = (args) => {
  const d = (((args as { data?: unknown }).data) || {}) as {
    lang?: AppLanguage;
    title?: string;
    desc?: string;
  };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const location = (args as { location?: { pathname?: string } }).location;
  const path = typeof location?.pathname === "string" && location.pathname.startsWith("/")
    ? location.pathname
    : `/${lang}/__guides-manifest__`;
  const title = d.title || "";
  const description = d.desc || "";
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    isPublished: false,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

