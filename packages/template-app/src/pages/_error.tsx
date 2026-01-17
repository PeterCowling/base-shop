// packages/template-app/src/pages/_error.tsx

import { TranslationsProvider, useTranslations } from "@acme/i18n";
import en from "@acme/i18n/en.json";

type ErrorCtx = {
  res?: { statusCode?: number };
  err?: { statusCode?: number };
};

function ErrorInner({ statusCode }: { statusCode?: number }) {
  const t = useTranslations();
  const code = statusCode ?? 500;
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
          {t("pages.error.title", { code })}
        </h1>
        <p style={{ marginBottom: "var(--space-3)", opacity: 0.8 }}>
          {t("pages.error.description")}
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "var(--space-2) var(--space-3)",
            border: "1px solid currentColor", // i18n-exempt -- DS-000 CSS shorthand value, not user-facing copy [ttl=2026-01-01]
            borderRadius: "0.5rem",
            textDecoration: "none",
          }}
        >
          {t("pages.error.cta")}
        </a>
      </div>
    </main>
  );
}

function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <TranslationsProvider messages={en}>
      <ErrorInner statusCode={statusCode} />
    </TranslationsProvider>
  );
}

ErrorPage.getInitialProps = ({ res, err }: ErrorCtx) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
