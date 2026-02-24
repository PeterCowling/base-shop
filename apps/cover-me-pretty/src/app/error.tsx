"use client";

import { useTranslations } from "@acme/i18n/Translations";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const t = useTranslations();

  const title = t("pages.error.title", { code: 500 });
  const subtitle = t("pages.error.description");
  const cta = t("pages.error.cta");
  const retry = t("common.retry");

  // i18n-exempt -- TURBO-309 [ttl=2026-12-31] fallback copy only when translation keys are unavailable in global error boundary
  const FALLBACK_TITLE_TEXT = "500 - Something went wrong";
  // i18n-exempt -- TURBO-309 [ttl=2026-12-31] fallback copy only when translation keys are unavailable in global error boundary
  const FALLBACK_SUBTITLE_TEXT = "Please try again, or return to the homepage.";
  // i18n-exempt -- TURBO-309 [ttl=2026-12-31] fallback copy only when translation keys are unavailable in global error boundary
  const FALLBACK_CTA_TEXT = "Go to homepage";
  // i18n-exempt -- TURBO-309 [ttl=2026-12-31] fallback copy only when translation keys are unavailable in global error boundary
  const FALLBACK_RETRY_TEXT = "Try again";

  const titleText =
    title === "error.title" ? FALLBACK_TITLE_TEXT : title;
  const subtitleText =
    subtitle === "error.description"
      ? FALLBACK_SUBTITLE_TEXT
      : subtitle;
  const ctaText = cta === "error.cta" ? FALLBACK_CTA_TEXT : cta;
  const retryText = retry === "common.retry" ? FALLBACK_RETRY_TEXT : retry;

  return (
    <main className="min-h-dvh grid place-items-center px-4 py-16 text-center">
      <div>
        <h1 className="mb-3 text-2xl leading-tight">{titleText}</h1>
        <p className="mb-6 opacity-80">{subtitleText}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-4 py-2.5"
            onClick={reset}
            type="button"
          >
            {retryText}
          </button>
          <a
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-4 py-2.5 no-underline"
            href="/"
          >
            {ctaText}
          </a>
        </div>
        {process.env.NODE_ENV !== "production" && error?.message ? (
          <p className="mt-4 text-xs opacity-70">{error.message}</p>
        ) : null}
      </div>
    </main>
  );
}
