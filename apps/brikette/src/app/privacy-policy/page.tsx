// src/app/privacy-policy/page.tsx
// Redirect /privacy-policy → /en/privacy-policy (static-export compatible)
import { type AppLanguage, i18nConfig } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

const lang = i18nConfig.fallbackLng as AppLanguage;
const targetPath = `/${lang}/${getSlug("privacyPolicy", lang)}`;

export default function PrivacyPolicyRedirect() {
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
      <main className="mx-auto max-w-3xl px-8 py-10">
        <p>Redirecting to <a href={targetPath}>{targetPath}</a>...</p>
      </main>
    </>
  );
}
