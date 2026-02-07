// src/components/home/ReviewsCarousel.tsx
"use client"; // i18n-exempt -- PB-123 Next.js directive, not user-facing copy [ttl=2025-12-31]

import { useCallback, useEffect, useState } from "react";

import { useTranslations } from "@acme/i18n";

import { Inline } from "../atoms/primitives/Inline";

export type Review = { nameKey: string; quoteKey: string };

const DEFAULT_REVIEWS: Review[] = [
  { nameKey: "review.anna.name", quoteKey: "review.anna.quote" },
  { nameKey: "review.luca.name", quoteKey: "review.luca.quote" },
  { nameKey: "review.emma.name", quoteKey: "review.emma.quote" },
];

export default function ReviewsCarousel({
  reviews,
}: {
  reviews?: Review[];
}) {
  const t = useTranslations();
  const [i, setI] = useState(0);
  // i18n-exempt: CSS class strings for layout only
  const SECTION_CLASS = "bg-muted py-16"; // i18n-exempt -- PB-123 CSS classes [ttl=2025-12-31]
  const NAME_CLASS = "font-semibold text-muted"; // i18n-exempt -- PB-123 CSS classes [ttl=2025-12-31]
  const TOKEN_MUTED = "--color-muted"; // i18n-exempt -- PB-123 design token name [ttl=2025-12-31]
  const TOKEN_FG = "--color-fg"; // i18n-exempt -- PB-123 design token name [ttl=2025-12-31]

  const list = reviews && reviews.length ? reviews : DEFAULT_REVIEWS;

  const next = useCallback(
    () => setI((n) => (n + 1) % list.length),
    [list.length]
  );
  const prev = useCallback(
    () => setI((n) => (n - 1 + list.length) % list.length),
    [list.length]
  );
  useEffect(() => {
    if (!list.length) return;
    const id = setInterval(next, 8000);
    return () => clearInterval(id);
  }, [list.length, next]);

  if (!list.length) return null;
  const { nameKey, quoteKey } = list[i % list.length];

  const prevButtonLabel = t("reviews.prev");
  const nextButtonLabel = t("reviews.next");

  return (
    <section className={SECTION_CLASS} data-token={TOKEN_MUTED}>
      <div className="mx-auto w-full px-4 text-center">
        <blockquote
          className="mb-6 text-2xl font-medium text-fg italic"
          data-token={TOKEN_FG}
        >
          {t(quoteKey)}
        </blockquote>
        <div className={NAME_CLASS} data-token={TOKEN_MUTED}>
          {"— "}
          {t(nameKey)}
        </div>
        <Inline alignY="center" gap={4} className="mt-8 justify-center">
          <button
            aria-label={prevButtonLabel}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2"
            onClick={prev}
          >
            <span aria-hidden="true">{/* i18n-exempt: decorative glyph */}‹</span>
            <span className="sr-only">{prevButtonLabel}</span>
          </button>
          <button
            aria-label={nextButtonLabel}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2"
            onClick={next}
          >
            <span aria-hidden="true">{/* i18n-exempt: decorative glyph */}›</span>
            <span className="sr-only">{nextButtonLabel}</span>
          </button>
        </Inline>
      </div>
    </section>
  );
}
