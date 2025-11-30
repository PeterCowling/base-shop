// apps/cover-me-pretty/src/pages/_error.tsx
/**
 * Minimal Pages Router error boundary.
 *
 * Next.js calls this component to render server errors (and sometimes
 * client-side errors) when exporting.  It should not import any app-specific
 * providers or components; otherwise, those may throw and prevent the
 * error page from rendering.
 */

import { useTranslations } from "@i18n/Translations";

type ErrorContext = {
  res?: { statusCode?: number };
  err?: { statusCode?: number };
};

function ErrorPage({ statusCode }: { statusCode?: number }) {
  const code = statusCode ?? 500;
  const t = useTranslations();

  // Resolve messages via i18n, with safe fallbacks for when no provider is mounted.
  const title = t("pages.error.title", { code });
  const subtitle = t("pages.error.description");
  const cta = t("pages.error.cta");

  const FALLBACK_TITLE_TEXT = "Something went wrong"; // i18n-exempt -- ABC-123 fallback when i18n context is unavailable during hard error rendering [ttl=2025-06-30]
  const FALLBACK_SUBTITLE_TEXT = "Please try again, or return to the homepage."; // i18n-exempt -- ABC-123 fallback when i18n context is unavailable during hard error rendering [ttl=2025-06-30]
  const FALLBACK_CTA_TEXT = "Go to homepage"; // i18n-exempt -- ABC-123 fallback when i18n context is unavailable during hard error rendering [ttl=2025-06-30]

  const titleResolved = title === "error.title" ? (
    <>
      {code} — {FALLBACK_TITLE_TEXT}
    </>
  ) : (
    title
  );
  const subtitleResolved = subtitle === "error.description" ? (
    <>{FALLBACK_SUBTITLE_TEXT}</>
  ) : (
    subtitle
  );
  const ctaResolved = cta === "error.cta" ? (
    <>{FALLBACK_CTA_TEXT}</>
  ) : (
    cta
  );

  return (
    <main className="min-h-dvh grid place-items-center py-16 px-4 text-center">
      <div>
        <h1 className="text-2xl leading-tight mb-3">{titleResolved}</h1>
        <p className="mb-6 opacity-80">{subtitleResolved}</p>
        <a
          href="/"
          className="inline-flex items-center justify-center border rounded-md no-underline px-4 py-2.5 min-h-11 min-w-11"
        >
          {ctaResolved}
        </a>
      </div>
    </main>
  );
}

// `getInitialProps` allows access to the status code on server error
ErrorPage.getInitialProps = ({ res, err }: ErrorContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
