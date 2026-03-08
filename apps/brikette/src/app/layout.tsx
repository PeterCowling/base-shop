import "@/styles/global.css";

import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { initTheme } from "@acme/platform-core/utils";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { CookieConsentBanner } from "@/components/consent/CookieConsent";
import { GA_MEASUREMENT_ID, IS_PROD, NOINDEX_PREVIEW, PUBLIC_DOMAIN, SITE_DOMAIN } from "@/config/env";
import { BASE_URL } from "@/config/site";
import { type AppLanguage, i18nConfig } from "@/i18n.config";
import { buildGA4InlineScript } from "@/utils/ga4-consent-script";
import { BRAND_PRIMARY_DARK_RGB, BRAND_PRIMARY_RGB, toRgb } from "@/utils/theme-constants";

// Determine if noindex should be applied (non-production preview/staging only)
const isStagingDomain = Boolean(
  SITE_DOMAIN?.includes("staging.") || PUBLIC_DOMAIN?.includes("staging."),
);
const shouldNoIndex = !IS_PROD && (NOINDEX_PREVIEW === "1" || isStagingDomain);

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL || "https://hostel-positano.com"),
  openGraph: {
    siteName: "Hostel Brikette", // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Next.js metadata export, not rendered UI
  },
  twitter: {
    site: "@hostelbrikette", // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Twitter handle, not rendered UI
    creator: "@hostelbrikette", // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Twitter handle, not rendered UI
  },
  ...(shouldNoIndex ? { robots: { index: false, follow: true } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: toRgb(BRAND_PRIMARY_RGB) }, // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS media query, not rendered UI
    { media: "(prefers-color-scheme: dark)", color: toRgb(BRAND_PRIMARY_DARK_RGB) }, // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS media query, not rendered UI
  ],
};

const resolveHtmlLang = (lang: string | undefined): AppLanguage =>
  i18nConfig.supportedLngs.includes(lang as AppLanguage)
    ? (lang as AppLanguage)
    : (i18nConfig.fallbackLng as AppLanguage);

const HEAD_RELOCATOR_SCRIPT = `
(function () {
  var selector = [
    "title",
    "meta[name=\\"description\\"]",
    "meta[name=\\"robots\\"]",
    "meta[property^=\\"og:\\"]",
    "meta[name^=\\"twitter:\\"]",
    "link[rel=\\"canonical\\"]",
    "link[rel=\\"alternate\\"]"
  ].join(",");

  var scheduled = false;
  function moveMetadataToHead() {
    scheduled = false;
    try {
      var head = document.head;
      var body = document.body;
      if (!head || !body) return;
      var nodes = body.querySelectorAll(selector);
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!el || el.parentNode === head) continue;
        if (el.closest && el.closest("noscript")) continue;
        head.appendChild(el);
      }
    } catch (e) {
      // ignore
    }
  }

  function scheduleMove() {
    if (scheduled) return;
    scheduled = true;
    Promise.resolve().then(moveMetadataToHead);
  }

  scheduleMove();
  try {
    var obs = new MutationObserver(scheduleMove);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      try {
        obs.disconnect();
      } catch (e) {
        // ignore
      }
    }, 5000);
  } catch (e) {
    // ignore
  }
	})();
	`;

const STATIC_EXPORT_HARD_NAV_SCRIPT = `
(function () {
  // Next App Router prefetches visible links via IntersectionObserver and
  // requests RSC tree files (/*/__next._tree.txt). Those files are not
  // deployed in our static Pages export, so disable viewport prefetching.
  if (typeof window.IntersectionObserver === "function") {
    window.IntersectionObserver = function () {
      return {
        observe: function () {},
        unobserve: function () {},
        disconnect: function () {},
        takeRecords: function () {
          return [];
        },
        root: null,
        rootMargin: "",
        thresholds: [],
      };
    };
  }

  function isModifiedClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  function shouldBypass(anchor) {
    if (!anchor) return true;
    var href = anchor.getAttribute("href");
    if (!href) return true;
    if (href.indexOf("#") === 0) return true;
    if (anchor.getAttribute("target") === "_blank") return true;
    if (anchor.hasAttribute("download")) return true;
    if (anchor.getAttribute("rel") === "external") return true;
    return false;
  }

  document.addEventListener(
    "click",
    function (event) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (isModifiedClick(event)) return;
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;
      var anchor = target.closest("a[href]");
      if (!anchor || shouldBypass(anchor)) return;

      try {
        var url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        event.preventDefault();
        window.location.assign(url.href);
      } catch (e) {
        // ignore invalid URLs
      }
    },
    true,
  );
})();
`;

type RootLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang?: string }>;
};

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { lang } = await params;
  const htmlLang = resolveHtmlLang(lang);
  const htmlDir = htmlLang === "ar" ? "rtl" : "ltr";
  const shouldLoadGA = IS_PROD && typeof GA_MEASUREMENT_ID === "string" && GA_MEASUREMENT_ID.length > 0;
  const gaMeasurementId = shouldLoadGA ? GA_MEASUREMENT_ID : null;
  const isStaticExportBuild = process.env.NEXT_PUBLIC_OUTPUT_EXPORT === "1";

  return (
    <html lang={htmlLang} dir={htmlDir} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        {/* Theme init script - runs before React hydrates to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
        {/* Ensure streamed metadata ends up in <head> for crawlers/audits */}
        <script dangerouslySetInnerHTML={{ __html: HEAD_RELOCATOR_SCRIPT }} />
        {/* Static export on Cloudflare Pages does not serve App Router RSC tree files.
            Force hard navigations so links stay functional without client RSC fetches. */}
        {isStaticExportBuild ? (
          <script dangerouslySetInnerHTML={{ __html: STATIC_EXPORT_HARD_NAV_SCRIPT }} />
        ) : null}
        {gaMeasurementId ? (
          <>
            {/* Consent Mode v2 defaults + gtag config — synchronous in <head> before gtag.js loads */}
            <script
              dangerouslySetInnerHTML={{
                __html: buildGA4InlineScript({ measurementId: gaMeasurementId, isInternalTraffic: !IS_PROD }),
              }}
            />
            {/* gtag.js CDN — loaded after page becomes interactive for better performance */}
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`}
              strategy="afterInteractive" // i18n-exempt -- LINT-1007 [ttl=2026-12-31] next/script API prop, not rendered UI
            />
          </>
        ) : null}
      </head>
      <body className="antialiased">
        {/* SPA page_view tracking — fires gtag('config') on every client-side
            route change. The inline snippet above handles the initial hard-load.
            Pattern B: skips first render to avoid double-counting on hard load. */}
        {gaMeasurementId ? <PageViewTracker /> : null}
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
