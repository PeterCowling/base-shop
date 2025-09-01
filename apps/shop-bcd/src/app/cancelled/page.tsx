// apps/shop-bcd/src/app/cancelled/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Payment cancelled page (non-locale specific).
 * With strictNullChecks, useSearchParams() may be null, so guard it.
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
    <Suspense fallback={null}>
      <CancelledContent />
    </Suspense>
  );
}
