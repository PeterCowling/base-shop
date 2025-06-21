// src/components/home/ReviewsCarousel.tsx
"use client";

import { useTranslations } from "@/i18n/Translations";
import { useCallback, useEffect, useState } from "react";

type Review = { nameKey: string; quoteKey: string };

const REVIEWS: Review[] = [
  { nameKey: "review.anna.name", quoteKey: "review.anna.quote" },
  { nameKey: "review.luca.name", quoteKey: "review.luca.quote" },
  { nameKey: "review.emma.name", quoteKey: "review.emma.quote" },
];

export default function ReviewsCarousel() {
  const t = useTranslations();
  const [i, setI] = useState(0);

  const next = useCallback(() => setI((n) => (n + 1) % REVIEWS.length), []);

  useEffect(() => {
    const id = setInterval(next, 8000);
    return () => clearInterval(id);
  }, [next]);

  const { nameKey, quoteKey } = REVIEWS[i];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto text-center px-4">
        <blockquote className="text-2xl font-medium text-gray-800 mb-6 italic">
          “{t(quoteKey)}”
        </blockquote>
        <div className="text-gray-600 font-semibold">— {t(nameKey)}</div>
      </div>
    </section>
  );
}
