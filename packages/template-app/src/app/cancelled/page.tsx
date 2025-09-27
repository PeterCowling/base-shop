// packages/template-app/src/app/cancelled/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Non-locale-specific payment-cancelled page.
 * Guards against `useSearchParams()` returning null when strictNullChecks is enabled.
 */
function CancelledContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") ?? null;

  return (
    <div className="mx-auto py-20 text-center">
      <h1 className="mb-4 text-3xl font-semibold">{/* i18n-exempt: transactional status */}Payment cancelled</h1>
      <p>{/* i18n-exempt: transactional status detail */}You have not been charged. Feel free to keep shopping.</p>
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
