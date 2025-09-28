"use client";

export type Testimonial = { quote: string; name?: string };

export default function Testimonials({
  testimonials = [],
  minItems,
  maxItems,
}: {
  testimonials?: Testimonial[];
  minItems?: number;
  maxItems?: number;
}) {
  const list = testimonials.slice(0, maxItems ?? testimonials.length);
  if (!list.length || list.length < (minItems ?? 0)) return null;
  return (
    <section className="space-y-4">
      {list.map((t) => (
        <blockquote
          key={`${t.name ?? "anon"}:${t.quote}`}
          className="text-center"
        >
          <p className="mb-2 italic">“{t.quote}”</p>
          {t.name && (
            <footer className="text-sm text-muted">— {t.name}</footer>
          )}
        </blockquote>
      ))}
    </section>
  );
}
