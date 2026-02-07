"use client";
import { useEffect, useState } from "react";

import { useTranslations } from "@acme/i18n";

export type SliderTestimonial = { quote: string; name?: string };

export default function TestimonialSlider({
  testimonials = [],
  minItems,
  maxItems,
}: {
  testimonials?: SliderTestimonial[];
  minItems?: number;
  maxItems?: number;
}) {
  const list = testimonials.slice(0, maxItems ?? testimonials.length);
  const [i, setI] = useState(0);
  const next = () => setI((n) => (n + 1) % list.length);
  const prev = () => setI((n) => (n - 1 + list.length) % list.length);
  // Hooks must be called unconditionally and before any early returns
  const t = useTranslations();

  useEffect(() => {
    if (!list.length) return;
    const id = setInterval(
      () => setI((n) => (n + 1) % list.length),
      5000,
    );
    return () => clearInterval(id);
  }, [list.length]);

  if (!list.length || list.length < (minItems ?? 0)) return null;
  const current = list[i % list.length];
  return (
    <section className="relative space-y-2 text-center">
      <blockquote className="italic">{current.quote}</blockquote>
      {current.name && <footer className="text-sm text-muted">— {current.name}</footer>}
      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label={t("Previous slide") as string}
            className="absolute start-2 top-1/2 -translate-y-1/2 min-h-10 min-w-10 h-10 w-10 p-0 text-center leading-10"
          >
            {/* i18n-exempt: using chevron as icon, aria-label localized */}
            <span aria-hidden>‹</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={t("Next slide") as string}
            className="absolute end-2 top-1/2 -translate-y-1/2 min-h-10 min-w-10 h-10 w-10 p-0 text-center leading-10"
          >
            {/* i18n-exempt: using chevron as icon, aria-label localized */}
            <span aria-hidden>›</span>
          </button>
        </>
      )}
    </section>
  );
}
