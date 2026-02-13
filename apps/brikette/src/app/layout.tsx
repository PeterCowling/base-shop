import "@/styles/global.css";

import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { initTheme } from "@acme/platform-core/utils";

import { CookieConsentBanner } from "@/components/consent/CookieConsent";
import { GA_MEASUREMENT_ID, IS_PROD, NOINDEX_PREVIEW, PUBLIC_DOMAIN, SITE_DOMAIN } from "@/config/env";
import { BASE_URL } from "@/config/site";
import { buildGA4InlineScript } from "@/utils/ga4-consent-script";
import { BRAND_PRIMARY_DARK_RGB, BRAND_PRIMARY_RGB, toRgb } from "@/utils/theme-constants";

// Determine if noindex should be applied (staging/preview environments)
const shouldNoIndex =
  NOINDEX_PREVIEW === "1" ||
  Boolean(SITE_DOMAIN?.includes("staging.") || PUBLIC_DOMAIN?.includes("staging."));

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

export default function RootLayout({ children }: { children: ReactNode }) {
  const shouldLoadGA = IS_PROD && typeof GA_MEASUREMENT_ID === "string" && GA_MEASUREMENT_ID.length > 0;
  const gaMeasurementId = shouldLoadGA ? GA_MEASUREMENT_ID : null;

  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        {/* Theme init script - runs before React hydrates to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
        {/* Ensure streamed metadata ends up in <head> for crawlers/audits */}
        <script dangerouslySetInnerHTML={{ __html: HEAD_RELOCATOR_SCRIPT }} />
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
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
