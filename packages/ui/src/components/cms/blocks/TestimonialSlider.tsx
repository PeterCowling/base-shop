"use client";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!list.length) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [list.length]);

  if (!list.length || list.length < (minItems ?? 0)) return null;
  const t = list[i % list.length];
  return (
    <section className="relative space-y-2 text-center">
      <blockquote className="italic">{t.quote}</blockquote>
      {t.name && <footer className="text-sm text-muted">— {t.name}</footer>}
      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}
