// apps/cover-me-pretty/src/app/cancelled/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Section from "@ui/components/cms/blocks/Section";
import { useTranslations } from "@acme/i18n";

/**
 * Non-locale-specific payment-cancelled page.
 *
 * With strictNullChecks enabled, useSearchParams() may return null,
 * so we guard it with optional chaining.  This prevents TypeScript
 * from complaining about potential null values.
 */
function CancelledContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") ?? null;

  return (
    <Section contentWidth="narrow">
      <div className="py-20 px-4 text-center">
        <h1 className="mb-4 text-3xl font-semibold">{t("cancelled.title")}</h1>
        <p>{t("cancelled.desc")}</p>
        {error && (
          <p className="text-danger mt-4 text-sm" data-token="--color-danger"> {/* i18n-exempt -- DS-1234 class names/design tokens; not user-visible copy */}
            {/* i18n-exempt -- DS-1234 error text originates from upstream or query param */}
            {error}
          </p>
        )}
      </div>
    </Section>
  );
}

export default function Cancelled() {
  return (
    <Suspense fallback={null}>
      <CancelledContent />
    </Suspense>
  );
}
