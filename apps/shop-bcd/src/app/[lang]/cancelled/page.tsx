// apps/shop-bcd/src/app/[lang]/cancelled/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Payment cancelled page.
 *
 * With strictNullChecks enabled, useSearchParams() may return null, so we
 * guard against that.  The UI remains the same: it shows a cancellation
 * message and optionally displays an error from the query string.
 */
function CancelledContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") ?? null;

  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="mb-4 text-3xl font-semibold">Payment cancelled</h1>
      <p>You have not been charged. Feel free to keep shopping.</p>
      {error && (
        <p className="text-danger mt-4 text-sm" data-token="--color-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Cancelled() {
  return (
    <Suspense>
      <CancelledContent />
    </Suspense>
  );
}
