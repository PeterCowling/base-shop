// packages/template-app/src/pages/_error.tsx

type ErrorCtx = {
  res?: { statusCode?: number };
  err?: { statusCode?: number };
};

function ErrorPage({ statusCode }: { statusCode?: number }) {
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
        {/* i18n-exempt -- TMP-001: minimal template error message */}
        <h1
          style={{
            fontSize: "2rem",
            lineHeight: 1.2,
            marginBottom: "var(--space-2)",
          }}
        >
          {code} — Something went wrong
        </h1>
        <p style={{ marginBottom: "var(--space-3)", opacity: 0.8 }}>
          Please try again, or return to the homepage.
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

ErrorPage.getInitialProps = ({ res, err }: ErrorCtx) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
