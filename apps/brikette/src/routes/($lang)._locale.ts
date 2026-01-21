// src/routes/($lang)._locale.ts
// Minimal locale guard loader for tests and future routing
import { type ClientLoaderFunctionArgs,redirect } from "react-router-dom";

import { type AppLanguage,i18nConfig } from "@/i18n.config";

export async function clientLoader({ request, params }: ClientLoaderFunctionArgs) {
  const { supportedLngs, fallbackLng } = i18nConfig;
  const maybeLang = (params?.["lang"] ?? "").toLowerCase();
  const isSupported = supportedLngs.includes(maybeLang as AppLanguage);

  if (!isSupported) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const hasLangParam = typeof params?.["lang"] === "string" && params["lang"].length > 0;
    const rest = hasLangParam ? pathname.replace(/^\/[^/]+/, "") : pathname;
    const normalisedRest = rest.length === 0 ? "/" : rest;
    const withLeadingSlash = normalisedRest.startsWith("/") ? normalisedRest : `/${normalisedRest}`;
    const location = withLeadingSlash === "/" ? `/${fallbackLng}/` : `/${fallbackLng}${withLeadingSlash}`;
    throw redirect(location);
  }
  return null;
}
