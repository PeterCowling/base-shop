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
          {code} — Something went wrong
        </h1>
        <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
          Please try again, or return to the homepage.
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

ErrorPage.getInitialProps = ({ res, err }: ErrorCtx) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
