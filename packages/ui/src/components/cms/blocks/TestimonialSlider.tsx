"use client";
import { useEffect, useState } from "react";

export type SliderTestimonial = { quote: string; name?: string };

export default function TestimonialSlider({
  testimonials = [],
}: {
  testimonials?: SliderTestimonial[];
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!testimonials.length) return;
    const id = setInterval(
      () => setI((n) => (n + 1) % testimonials.length),
      5000
    );
    return () => clearInterval(id);
  }, [testimonials.length]);

  if (!testimonials.length) return null;
  const t = testimonials[i];
  return (
    <section className="space-y-2 text-center">
      <blockquote className="italic">“{t.quote}”</blockquote>
      {t.name && <footer className="text-sm text-muted">— {t.name}</footer>}
    </section>
  );
}
