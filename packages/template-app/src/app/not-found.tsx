// packages/template-app/src/app/not-found.tsx

/**
 * Minimal App Router not-found page for template-app.
 */
export default function NotFound() {
  return (
    <div
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
          Page not found
        </h1>
        <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
          The page you’re looking for doesn’t exist or has moved.
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
    </div>
  );
}
