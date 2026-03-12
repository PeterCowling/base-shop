"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ lang?: string }>();
  const lang = params?.lang ?? "en";

  useEffect(() => {
    console.error("Caryina error boundary:", error);
  }, [error]);

  return (
    // eslint-disable-next-line ds/no-arbitrary-tailwind -- CARYINA-107 error boundary needs reliable vertical centering [ttl=2027-01-01]
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <p
        className="text-6xl font-light tracking-tight"
        style={{ fontFamily: "var(--font-cormorant-garamond, serif)" }}
      >
        Oops
      </p>
      <h1
        className="mt-4 text-xl font-light"
        style={{
          fontFamily: "var(--font-cormorant-garamond, serif)",
          color: "hsl(var(--color-fg-muted))",
        }}
      >
        Something went wrong
      </h1>
      <p
        className="mt-3 max-w-sm text-sm"
        style={{ color: "hsl(var(--color-fg-muted))" }}
      >
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="btn-primary min-h-11 min-w-11 rounded-full px-6 py-2.5 text-sm"
        >
          Try again
        </button>
        <Link
          href={`/${lang}/shop`}
          className="text-sm underline underline-offset-4"
          style={{ color: "hsl(var(--color-fg-muted))" }}
        >
          Back to shop
        </Link>
      </div>
    </div>
  );
}
