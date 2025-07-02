"use client";

export type Testimonial = { quote: string; name?: string };

export default function Testimonials({
  testimonials = [],
}: {
  testimonials?: Testimonial[];
}) {
  if (!testimonials.length) return null;
  return (
    <section className="space-y-4">
      {testimonials.map((t, i) => (
        <blockquote key={i} className="text-center">
          <p className="mb-2 italic">“{t.quote}”</p>
          {t.name && (
            <footer className="text-sm text-gray-600">— {t.name}</footer>
          )}
        </blockquote>
      ))}
    </section>
  );
}
