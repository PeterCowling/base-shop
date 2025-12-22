import "@/styles/global.css";
import "react-datepicker/dist/react-datepicker.css";
import "swiper/css";
import "swiper/css/navigation";

import type { AppProps } from "next/app";
import Head from "next/head";
import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import type { ResourceKey } from "i18next";

import i18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import type { I18nResourcesPayload } from "@/next/i18nResources";
import { getOrigin } from "@/root/environment";
import { BRAND_PRIMARY_DARK_RGB, BRAND_PRIMARY_RGB, toRgb } from "@/root/theme";
import {
  RouterStateProvider,
  locationFromUrl,
  toHref,
  type NavigateOptions,
  type Location,
  type RouterState,
  type RouteMatch,
  type NavigateFunction,
  type To,
} from "@/compat/router-state";
import { BASE_URL } from "@/config/site";
import { NOINDEX_PREVIEW, PUBLIC_DOMAIN, SITE_DOMAIN } from "@/config/env";
import type { ResolvedMatch } from "@/compat/route-runtime";

type PageProps = {
  routerState?: RouterState;
  matches?: ResolvedMatch[];
  params?: Record<string, string | undefined>;
  i18n?: I18nResourcesPayload;
};

const fallbackLang = i18nConfig.fallbackLng as AppLanguage;
const PREFERS_DARK_MEDIA = "(prefers-color-scheme: dark)"; // i18n-exempt -- SEO-315 [ttl=2026-01-31] Media query value
const getResourceString = (lang: AppLanguage, namespace: string, key: string): string | undefined => {
  const value = i18n.getResource(lang, namespace, key);
  return typeof value === "string" ? value : undefined;
};

const hydrateI18nResources = (payload?: I18nResourcesPayload): void => {
  if (!payload) return;
  const applyResources = (targetLang: AppLanguage, resources: Record<string, unknown>) => {
    if (!resources || typeof resources !== "object") return;
    for (const [namespace, data] of Object.entries(resources)) {
      if (data === undefined) continue;
      i18n.addResourceBundle(targetLang, namespace, data as ResourceKey, true, true);
    }
  };

  applyResources(payload.lang, payload.resources);
  if (payload.fallback) {
    applyResources(payload.fallback.lang, payload.fallback.resources);
  }

  if (i18n.language !== payload.lang) {
    i18n.language = payload.lang;
  }
};

const buildRouterStateFromMatches = (
  matches: ResolvedMatch[] | undefined,
  params: Record<string, string | undefined>,
  location: Location,
  navigate: NavigateFunction,
): RouterState => {
  if (!matches || matches.length === 0) {
    return { location, params, matches: [], loaderData: {}, navigate };
  }

  const routeMatches: RouteMatch[] = matches.map((match) => ({
    route: {
      id: match.id,
      ...(match.handle !== undefined ? { handle: match.handle } : {}),
    },
    ...(match.data !== undefined ? { data: match.data } : {}),
  }));

  const loaderData = routeMatches.reduce<Record<string, unknown>>((acc, match) => {
    if (match.route?.id && match.data !== undefined) {
      acc[match.route.id] = match.data;
    }
    return acc;
  }, {});

  return { location, params, matches: routeMatches, loaderData, navigate };
};

function BriketteApp({ Component, pageProps }: AppProps<PageProps>): JSX.Element {
  const router = useRouter();

  hydrateI18nResources(pageProps.i18n);

  const navigate = useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") {
          window.history?.go?.(to);
        }
        return;
      }

      const href = toHref(to);
      if (options?.replace) {
        void router.replace(href);
      } else {
        void router.push(href);
      }
    },
    [router],
  );

  const location = useMemo(() => {
    const base = BASE_URL || "http://localhost";
    const href = new URL(router.asPath || "/", base).toString();
    return locationFromUrl(href);
  }, [router.asPath]);

  const state = useMemo<RouterState>(() => {
    if (pageProps.routerState) {
      return {
        ...pageProps.routerState,
        location,
        navigate,
      };
    }

    const params = pageProps.params ?? {};
    return buildRouterStateFromMatches(pageProps.matches, params, location, navigate);
  }, [pageProps.matches, pageProps.params, pageProps.routerState, location, navigate]);

  const lang = (state.params["lang"] as AppLanguage | undefined) ?? fallbackLang;
  const siteName =
    getResourceString(lang, "header", "title") ??
    getResourceString(fallbackLang, "header", "title") ??
    "";
  const twitterHandle =
    getResourceString(lang, "translation", "meta.twitterHandle") ??
    getResourceString(fallbackLang, "translation", "meta.twitterHandle") ??
    "";
  const shouldNoIndex =
    NOINDEX_PREVIEW === "1" ||
    Boolean(SITE_DOMAIN?.includes("staging.") || PUBLIC_DOMAIN?.includes("staging."));

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    if (!root.getAttribute("data-origin")) {
      root.setAttribute("data-origin", getOrigin());
    }
  }, [lang]);

  return (
    <RouterStateProvider state={state}>
      <Head>
        <meta property="og:site_name" content={siteName} />
        <meta name="twitter:site" content={twitterHandle} />
        {/* i18n-exempt -- SEO-315 [ttl=2026-01-31] Twitter meta name */}
        <meta name="twitter:creator" content={twitterHandle} />
        <meta name="theme-color" content={toRgb(BRAND_PRIMARY_RGB)} />
        <meta
          media={PREFERS_DARK_MEDIA}
          name="theme-color"
          content={toRgb(BRAND_PRIMARY_DARK_RGB)}
        />
        {shouldNoIndex && <meta name="robots" content="noindex" />}
      </Head>
      <Component {...pageProps} />
    </RouterStateProvider>
  );
}

export default BriketteApp;
