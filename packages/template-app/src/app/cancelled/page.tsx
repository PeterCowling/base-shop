// packages/template-app/src/app/cancelled/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "@acme/i18n/Translations";

/**
 * Non-locale-specific payment-cancelled page.
 * Guards against `useSearchParams()` returning null when strictNullChecks is enabled.
 */
function CancelledContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") ?? null;
  const t = useTranslations();

  return (
    <div className="mx-auto py-20 text-center">
      <h1 className="mb-4 text-3xl font-semibold">{t("cancelled.title")}</h1>
      <p>{t("cancelled.desc")}</p>
      {error && (
        <p className="text-danger mt-4 text-sm" data-token="--color-danger" /* i18n-exempt -- DEV-000 non-UI token [ttl=2026-01-01] */>
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
