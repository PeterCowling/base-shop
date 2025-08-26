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
  useEffect(() => {
    if (!list.length) return;
    const id = setInterval(
      () => setI((n) => (n + 1) % list.length),
      5000
    );
    return () => clearInterval(id);
  }, [list.length]);

  if (!list.length || list.length < (minItems ?? 0)) return null;
  const t = list[i % list.length];
  return (
    <section className="space-y-2 text-center">
      <blockquote className="italic">{t.quote}</blockquote>
      {t.name && <footer className="text-sm text-muted">— {t.name}</footer>}
    </section>
  );
}
