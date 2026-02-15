// src/components/booking/DirectPerksBlock.tsx
/* -------------------------------------------------------------------------- */
/*  "Why book direct" conversion copy block for booking modals               */
/* -------------------------------------------------------------------------- */

import { useTranslation } from "react-i18next";

import type { AppLanguage } from "@/i18n.config";

export interface DirectPerksBlockProps {
  readonly lang: AppLanguage;
  readonly className?: string;
}

export function DirectPerksBlock({ lang, className }: DirectPerksBlockProps): JSX.Element {
  const { t: tModals } = useTranslation("modals", { lng: lang });

  const heading = tModals("directPerks.heading", {
    // i18n-exempt -- BRIK-005 [ttl=2026-03-15] (fallback values for missing translations)
    defaultValue: "Why book direct?"
  }) as string;

  const items = (() => {
    const raw = tModals("directPerks.items", {
      returnObjects: true,
      defaultValue: [
        // i18n-exempt -- BRIK-005 [ttl=2026-03-15] (fallback values for missing translations)
        "Up to 25% off",
        // i18n-exempt -- BRIK-005 [ttl=2026-03-15] (fallback values for missing translations)
        "Complimentary breakfast",
        // i18n-exempt -- BRIK-005 [ttl=2026-03-15] (fallback values for missing translations)
        "Complimentary evening drink"
      ]
    });
    return Array.isArray(raw) ? (raw as string[]) : [];
  })();

  // Guard: if heading is empty or items array is empty, don't render
  if (!heading.trim() || items.length === 0) {
    return <></>;
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-brand-heading mb-2">
        {heading}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start text-sm text-brand-text/80">
            <span className="me-2 mt-0.5 text-brand-secondary">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
