// packages/template-app/src/pages/404.tsx

import { TranslationsProvider, useTranslations } from "@acme/i18n";
import en from "@acme/i18n/en.json";

/**
 * Minimal Pages Router 404 page for template-app, i18n-ready.
 */
function NotFoundInner() {
  const t = useTranslations();
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "var(--space-4) var(--space-1)",
        textAlign: "center",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "2rem",
            lineHeight: 1.2,
            marginBottom: "var(--space-2)",
          }}
        >
          {t("pages.404.title")}
        </h1>
        <p style={{ marginBottom: "var(--space-3)", opacity: 0.8 }}>
          {t("pages.404.description")}
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "var(--space-2) var(--space-3)",
            border: "1px solid currentColor", // i18n-exempt -- DEV-000 non-UI CSS value [ttl=2026-01-01]
            borderRadius: "0.5rem",
            textDecoration: "none",
          }}
        >
          {t("pages.404.cta")}
        </a>
      </div>
    </main>
  );
}

export default function NotFoundPage() {
  // Wrap with a local provider so the page works in the Pages Router too.
  return (
    <TranslationsProvider messages={en}>
      <NotFoundInner />
    </TranslationsProvider>
  );
}
