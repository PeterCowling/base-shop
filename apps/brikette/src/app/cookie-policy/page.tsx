// src/app/cookie-policy/page.tsx
// Redirect /cookie-policy → /en/cookie-policy (static-export compatible)
import { Section } from "@acme/design-system/atoms";

import { type AppLanguage, i18nConfig } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

const lang = i18nConfig.fallbackLng as AppLanguage;
const targetPath = `/${lang}/${getSlug("cookiePolicy", lang)}`;

export default function CookiePolicyRedirect() {
  return (
    <>
      {/* Inline script for immediate redirect */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace("${targetPath}");`,
        }}
      />
      {/* Fallback for noscript */}
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${targetPath}`} />
      </noscript>
      <Section as="main" padding="none" className="mx-auto max-w-3xl px-8 py-10">
        <p>
          <a href={targetPath}>{targetPath}</a>
        </p>
      </Section>
    </>
  );
}
