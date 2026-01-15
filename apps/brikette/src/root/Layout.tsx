// Breadcrumb JSON-LD and canonical/hreflang are emitted by templates
import { getThemeInitScript } from "@/utils/themeInit";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { type SupportedLanguage, isSupportedLanguage } from "../config";
import i18n from "../i18n";
import { i18nConfig, type AppLanguage } from "../i18n.config";
import { HeadBoundary } from "./boundaries";
import { getOrigin, getPathname, isTestEnvironment } from "./environment";
import { RouterBodyPlaceholders, RouterHeadPlaceholders } from "./routerPlaceholders";
import { BRAND_PRIMARY_DARK_RGB, BRAND_PRIMARY_RGB, toRgb } from "./theme";
import BreadcrumbStructuredData from "@/components/seo/BreadcrumbStructuredData";
import { buildBreadcrumb, buildLinks as buildCanonicalLinks } from "@/utils/seo";
import { GA_MEASUREMENT_ID, IS_PROD, NOINDEX_PREVIEW, PUBLIC_DOMAIN, SITE_DOMAIN } from "@/config/env";
// Removed runtime UA-sniffing font preloads; fonts are now preloaded via root links

function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = getPathname();

  const pathSegments = pathname
    .split("/")
    .map((segment) => segment.toLowerCase())
    .filter(Boolean);
  const matchedLanguage = pathSegments.find(
    (segment): segment is SupportedLanguage => isSupportedLanguage(segment)
  );
  const fallbackLanguage = i18nConfig.fallbackLng as AppLanguage;
  const lang: AppLanguage = (matchedLanguage as AppLanguage | undefined) ?? fallbackLanguage;
  const direction = lang === ("ar" as AppLanguage) ? "rtl" : "ltr";
  const origin = getOrigin();

  const getResourceString = (
    language: AppLanguage,
    namespace: string,
    key: string
  ): string | undefined => {
    const value = i18n.getResource(language, namespace, key);
    return typeof value === "string" ? value : undefined;
  };

  const siteName =
    getResourceString(lang, "header", "title") ??
    getResourceString(fallbackLanguage, "header", "title") ??
    "";
  const twitterHandle =
    getResourceString(lang, "translation", "meta.twitterHandle") ??
    getResourceString(fallbackLanguage, "translation", "meta.twitterHandle") ??
    "";
  const shouldNoIndex =
    NOINDEX_PREVIEW === "1" ||
    Boolean(SITE_DOMAIN?.includes("staging.") || PUBLIC_DOMAIN?.includes("staging."));

  /* c8 ignore start -- DOM mutations validated via Playwright smoke tests */
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (root) {
      root.setAttribute("lang", lang);
      root.setAttribute("dir", direction);
      if (!root.getAttribute("data-origin")) {
        root.setAttribute("data-origin", origin);
      }
    }
  }

  // Avoid React hooks in the Document Layout.
  // React Router calls Layout in non-standard contexts during dev/SSR,
  // which can make hook dispatchers unavailable. We rely on the
  // synchronous DOM mutation above to set attributes.
  /* c8 ignore stop */

  // Canonical/hreflang + breadcrumb: emit at the document level only for tests.
  // Route templates export meta()/links() for production builds.
  const shouldEmitFallbackHead = isTestEnvironment;
  const canonicalLinks = shouldEmitFallbackHead
    ? buildCanonicalLinks({ lang, origin, path: pathname })
    : [];
  const breadcrumb = shouldEmitFallbackHead
    ? buildBreadcrumb({ lang, origin, path: pathname, title: "", homeLabel: "" })
    : undefined;

  return (
    <I18nextProvider i18n={i18n}>
      <html
        data-origin={origin}
        lang={lang}
        dir={direction}
        className="scroll-smooth"
        suppressHydrationWarning
      >
        {/* eslint-disable-next-line @next/next/no-head-element -- LINT-1007 [ttl=2026-12-31] React Router document layout uses literal head */}
        <head>
          <meta charSet="utf-8" />
          {/* i18n-exempt -- SEO-315 ttl=2026-01-31 Viewport meta value */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {/* Page-specific templates output og:type; avoid global default */}
          <meta property="og:site_name" content={siteName} />
          <meta name="twitter:site" content={twitterHandle} />
          {/* i18n-exempt -- SEO-315 ttl=2026-01-31 Twitter meta name */}
          <meta name="twitter:creator" content={twitterHandle} />
          <meta name="theme-color" content={toRgb(BRAND_PRIMARY_RGB)} />
          {/* i18n-exempt -- SEO-315 ttl=2026-01-31 Media query value */}<meta media="(prefers-color-scheme: dark)" name="theme-color" content={toRgb(BRAND_PRIMARY_DARK_RGB)} />
          {/* Preview env guard: avoid indexing staging sites */}
          {shouldNoIndex ? <meta name="robots" content="noindex" /> : null}

          {/* Static assets are linked via Root links() function */}

          {/* Canonical + hreflang (also provided by routes) */}
          {shouldEmitFallbackHead
            ? canonicalLinks.map((l) => (
                <link key={`${l.rel}-${l.href}-${l.hrefLang ?? ""}`} rel={l.rel} href={l.href} {...(l.hrefLang ? { hrefLang: l.hrefLang } : {})} />
              ))
            : null}

          <HeadBoundary>
            <RouterHeadPlaceholders />
          </HeadBoundary>

          {/* Breadcrumb JSON-LD (lightweight; routes also provide more specific graphs) */}
          {breadcrumb ? <BreadcrumbStructuredData breadcrumb={breadcrumb} /> : null}

          <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />

          {/* GA4 (optional): inject only when configured and in production */}
          {IS_PROD && GA_MEASUREMENT_ID ? (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${GA_MEASUREMENT_ID}',{anonymize_ip:true});`,
                }}
              />
            </>
          ) : null}

          {/* Breadcrumb JSON-LD provided by templates where applicable */}
        </head>

        <body className="min-h-dvh bg-brand-surface text-brand-text antialiased dark:bg-brand-text dark:text-brand-surface">
          {children}
          <HeadBoundary>
            <RouterBodyPlaceholders />
          </HeadBoundary>
        </body>
      </html>
    </I18nextProvider>
  );
}

export { Layout };
