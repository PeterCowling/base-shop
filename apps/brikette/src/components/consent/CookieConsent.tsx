/* eslint-disable ds/no-hardcoded-copy -- BRIK-004 [ttl=2026-12-31] CMP configuration strings; i18n via vanilla-cookieconsent translations API is a future task */
"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

import { CONSENT_BANNER } from "@/config/env";

/**
 * Update Google Consent Mode v2 based on accepted cookie categories.
 *
 * Maps vanilla-cookieconsent category names to Google's consent parameters:
 * - "analytics" → analytics_storage
 * - "advertising" → ad_storage, ad_user_data, ad_personalization
 */
export function updateGtagConsent(categories: string[]): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const hasAnalytics = categories.includes("analytics");
  const hasAdvertising = categories.includes("advertising");

  window.gtag("consent", "update", {
    analytics_storage: hasAnalytics ? "granted" : "denied",
    ad_storage: hasAdvertising ? "granted" : "denied",
    ad_user_data: hasAdvertising ? "granted" : "denied",
    ad_personalization: hasAdvertising ? "granted" : "denied",
  });
}

/**
 * Cookie consent banner using vanilla-cookieconsent.
 *
 * Renders a GDPR-compliant cookie consent banner with three categories:
 * - Necessary (always on, read-only)
 * - Analytics (Google Analytics tracking)
 * - Advertising (Google Ads remarketing)
 *
 * On consent change, fires `gtag('consent', 'update', ...)` to update
 * Google Consent Mode v2 in real-time.
 *
 * Feature-flagged via NEXT_PUBLIC_CONSENT_BANNER env var.
 */
interface CookieConsentBannerProps {
  /** Override the env-based enabled flag (for testing) */
  enabledOverride?: boolean;
}

export function CookieConsentBanner({ enabledOverride }: CookieConsentBannerProps = {}): null {
  const enabled = enabledOverride ?? CONSENT_BANNER === "1";

  useEffect(() => {
    if (!enabled) return;

    CookieConsent.run({
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          autoClear: {
            cookies: [{ name: /^_ga/ }, { name: "_gid" }],
          },
        },
        advertising: {
          autoClear: {
            cookies: [{ name: /^_gcl/ }],
          },
        },
      },

      onFirstConsent: ({ cookie }) => {
        updateGtagConsent(cookie.categories);
      },

      onConsent: ({ cookie }) => {
        updateGtagConsent(cookie.categories);
      },

      onChange: ({ cookie }) => {
        updateGtagConsent(cookie.categories);
      },

      guiOptions: {
        consentModal: {
          layout: "box inline",
          position: "bottom right",
        },
      },

      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "Cookie preferences",
              description:
                "We use cookies to improve your experience and measure site performance. You can choose which categories to allow.",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              showPreferencesBtn: "Manage preferences",
            },
            preferencesModal: {
              title: "Cookie preferences",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              savePreferencesBtn: "Save preferences",
              sections: [
                {
                  title: "Necessary cookies",
                  description:
                    "These cookies are required for the website to function and cannot be disabled.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics cookies",
                  description:
                    "These cookies help us understand how visitors interact with our website by collecting anonymous usage data.",
                  linkedCategory: "analytics",
                },
                {
                  title: "Advertising cookies",
                  description:
                    "These cookies are used to show you relevant ads and measure advertising campaign effectiveness.",
                  linkedCategory: "advertising",
                },
                {
                  title: "More information",
                  description:
                    'For more details about our use of cookies, please visit our <a href="/en/cookie-policy">Cookie Policy</a>.',
                },
              ],
            },
          },
        },
      },
    });

    return () => {
      CookieConsent.reset();
    };
  }, [enabled]);

  return null;
}
