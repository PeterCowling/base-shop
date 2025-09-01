// apps/shop-bcd/src/app/not-found.tsx
import Link from "next/link";
import * as React from "react";

/**
 * A minimal not-found page for the shop app. This component is rendered
 * whenever a route doesn’t match. It avoids rendering React component objects
 * as plain children (the cause of previous errors) and uses simple inline
 * styles for layout. Feel free to customize the content and styling to match
 * your brand, but keep the structure straightforward to prevent runtime
 * serialization issues.
 */
export default function NotFound(): React.JSX.Element {
  return (
    <html lang="en">
      <body>
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
                marginBottom: "0.5rem",
              }}
            >
              Page not found
            </h1>
            <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
              The page you’re looking for doesn’t exist or has moved.
            </p>
            <Link
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
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
