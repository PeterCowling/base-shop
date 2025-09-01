// packages/template-app/src/pages/404.tsx

/**
 * Minimal Pages Router 404 page for template-app.
 *
 * Used by Next.js during static export. Simple markup prevents serialization errors.
 */
export default function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "4rem 1rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "2rem",
            lineHeight: 1.2,
            marginBottom: "0.75rem",
          }}
        >
          404 — Page not found
        </h1>
        <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
          We couldn’t find that page.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "0.625rem 1rem",
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
