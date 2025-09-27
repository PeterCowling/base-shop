// packages/template-app/src/pages/404.tsx

/**
 * Minimal Pages Router 404 page for template-app.
 */
export default function NotFoundPage() {
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
        {/* i18n-exempt -- TMP-001: minimal template 404 message */}
        <h1
          style={{
            fontSize: "2rem",
            lineHeight: 1.2,
            marginBottom: "var(--space-2)",
          }}
        >
          404 — Page not found
        </h1>
        <p style={{ marginBottom: "var(--space-3)", opacity: 0.8 }}>
          We couldn’t find that page.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "var(--space-2) var(--space-3)",
            border: "1px solid currentColor",
            borderRadius: "0.5rem",
            textDecoration: "none",
          }}
        >
          Go to homepage
        </a>
      </div>
    </main>
  );
}
