// packages/template-app/src/app/not-found.tsx
"use client";

import { useTranslations } from "@acme/i18n";

/**
 * Minimal App Router not-found page for template-app.
 */
export default function NotFound() {
  const t = useTranslations();
  return (
    <div
      className="grid place-items-center text-center py-16 px-4"
      style={{ minHeight: "100dvh" }}
    >
      <div>
        <h1 className="text-2xl leading-tight mb-3">{t("pages.404.title")}</h1>
        <p className="opacity-80 mb-6">{t("pages.404.description")}</p>
        <a
          href="/"
          className="inline-block rounded-md border px-4 py-2 no-underline min-h-11 min-w-11"
        >
          {t("pages.404.cta")}
        </a>
      </div>
    </div>
  );
}
