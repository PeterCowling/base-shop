// src/components/home/ReviewsCarousel.tsx
"use client";

import { useTranslations } from "@acme/i18n";
import { useCallback, useEffect, useState } from "react";

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

  const list = reviews && reviews.length ? reviews : DEFAULT_REVIEWS;
  if (!list.length) return null;

  const next = useCallback(
    () => setI((n) => (n + 1) % list.length),
    [list.length]
  );
  const prev = useCallback(
    () => setI((n) => (n - 1 + list.length) % list.length),
    [list.length]
  );
  useEffect(() => {
    const id = setInterval(next, 8000);
    return () => clearInterval(id);
  }, [next]);

  const { nameKey, quoteKey } = list[i];

  return (
    <section className="bg-muted py-16" data-token="--color-muted">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <blockquote
          className="mb-6 text-2xl font-medium text-fg italic"
          data-token="--color-fg"
        >
          “{t(quoteKey)}”
        </blockquote>
        <div className="font-semibold text-muted" data-token="--color-muted">
          — {t(nameKey)}
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <button
            aria-label="Previous review"
            className="px-2"
            onClick={prev}
          >
            ‹
          </button>
          <button
            aria-label="Next review"
            className="px-2"
            onClick={next}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
