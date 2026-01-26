// src/app/page.tsx
// Static language gateway - replaces SSR pages/index.tsx for static export
// Detects browser language via navigator.languages and redirects to best match
import type { Metadata } from "next";

import { LinkText, Section } from "@acme/design-system/atoms";

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
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 list-none p-0">
          {supported.map((lng) => (
            <li key={lng}>
              <LinkText asChild className="justify-center">
                <a href={`/${lng}`}>/{lng}</a>
              </LinkText>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
