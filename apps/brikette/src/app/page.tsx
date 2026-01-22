// src/app/page.tsx
// Static language gateway - replaces SSR pages/index.tsx for static export
// Detects browser language via navigator.languages and redirects to best match
import type { Metadata } from "next";

import { Grid } from "@acme/ui/atoms";
import { Section } from "@acme/ui/atoms";

import { BASE_URL } from "@/config/site";
import { i18nConfig } from "@/i18n.config";

const fallback = i18nConfig.fallbackLng;
const supported = i18nConfig.supportedLngs as readonly string[];

// Build the client-side language detection script
const languageDetectScript = `
(function() {
  var supported = ${JSON.stringify(supported)};
  var fallback = "${fallback}";
  var langs = (navigator.languages || [navigator.language]).map(function(l) {
    return l.toLowerCase().split("-")[0];
  });
  for (var i = 0; i < langs.length; i++) {
    if (supported.indexOf(langs[i]) !== -1) {
      window.location.replace("/" + langs[i]);
      return;
    }
  }
  window.location.replace("/" + fallback);
})();
`;

const host = BASE_URL || "https://hostel-positano.com";
const canonical = `${host}/${fallback}`;

export const metadata: Metadata = {
  title: "Hostel Brikette — Language Gateway",
  alternates: {
    canonical,
    languages: Object.fromEntries([
      ...supported.map((lng) => [lng, `${host}/${lng}`]),
      ["x-default", canonical],
    ]),
  },
};

export default function LanguageGatewayPage() {
  return (
    <>
      {/* Client-side language detection and redirect */}
      <script
        dangerouslySetInnerHTML={{ __html: languageDetectScript }}
      />
      {/* Fallback for noscript - redirect to default language */}
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=/${fallback}`} />
      </noscript>
      {/* Visible fallback UI for bots and users without JS */}
      <Section
        as="main"
        width="full"
        padding="none"
        className="mx-auto max-w-3xl px-8 py-10 font-sans text-brand-text"
      >
        {/* i18n-exempt -- LINT-1007 [ttl=2026-12-31] English-only gateway label */}
        <h1 className="text-xl font-semibold">Select a language</h1>
        <Grid
          as="ul"
          columns={{ base: 2, sm: 3, md: 4 }}
          gap={2}
          className="mt-6 list-none p-0"
        >
          {supported.map((lng) => (
            <li key={lng}>
              <a
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-brand-primary hover:underline"
                href={`/${lng}`}
              >
                /{lng}
              </a>
            </li>
          ))}
        </Grid>
      </Section>
    </>
  );
}
