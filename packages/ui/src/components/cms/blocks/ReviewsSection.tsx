"use client";

import * as React from "react";

type Review = {
  id: string;
  author?: string;
  rating?: number; // 1-5
  title?: string;
  body?: string;
  createdAt?: string;
};

type Aggregate = { ratingValue: number; reviewCount: number };

type Provider = "custom" | "yotpo" | "okendo";

export interface ReviewsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  provider?: Provider;
  productId?: string;
  items?: Review[]; // for custom provider
  minRating?: number;
  showAggregate?: boolean;
  emitJsonLd?: boolean;
  adapter?: (opts: { provider: Provider; productId?: string }) => Promise<{ items: Review[]; aggregate?: Aggregate }>;
}

/* eslint-disable ds/no-hardcoded-copy -- SEO-0001: JSON-LD schema constants are not user-facing copy */
function renderJsonLd(items: Review[], aggregate?: Aggregate) {
  const blocks: React.ReactNode[] = [];
  if (aggregate && Number.isFinite(aggregate.ratingValue) && Number.isFinite(aggregate.reviewCount)) {
    const agg = {
      "@context": "https://schema.org",
      "@type": "AggregateRating",
      ratingValue: aggregate.ratingValue,
      reviewCount: aggregate.reviewCount,
    };
    blocks.push(<script key="agg" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agg) }} />);
  }
  if (items.length) {
    const reviews = items.slice(0, 20).map((r) => ({
      "@type": "Review",
      author: r.author ? { "@type": "Person", name: r.author } : undefined,
      reviewRating: typeof r.rating === "number" ? { "@type": "Rating", ratingValue: r.rating } : undefined,
      datePublished: r.createdAt,
      name: r.title,
      reviewBody: r.body,
    }));
    const list = { "@context": "https://schema.org", "@type": "ItemList", itemListElement: reviews };
    blocks.push(<script key="reviews" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(list) }} />);
  }
  return blocks;
}
/* eslint-enable ds/no-hardcoded-copy */

export default function ReviewsSection({ provider = "custom", productId, items: inputItems = [], minRating = 0, showAggregate = true, emitJsonLd = true, adapter, className, ...rest }: ReviewsSectionProps) {
  const [items, setItems] = React.useState<Review[]>(inputItems);
  const [aggregate, setAggregate] = React.useState<Aggregate | undefined>(undefined);
  // i18n-exempt -- Fallback author label
  const FALLBACK_AUTHOR = "Anonymous";
  // i18n-exempt -- Aggregate review count label
  const basedOnReviews = (count: number) => `Based on ${count} reviews`;

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (provider === "custom") {
          setItems(inputItems);
          if (!showAggregate) return;
          const ratings = inputItems.map((r) => r.rating ?? 0).filter((n) => n > 0);
          const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
          if (!cancelled) setAggregate({ ratingValue: Number(avg.toFixed(2)), reviewCount: ratings.length });
          return;
        }
        if (typeof adapter === "function") {
          const res = await adapter({ provider, productId });
          if (!cancelled) {
            setItems(res.items ?? []);
            if (showAggregate) setAggregate(res.aggregate);
          }
        } else {
          // No adapter provided – leave empty
          if (!cancelled) {
            setItems([]);
            if (showAggregate) setAggregate(undefined);
          }
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setAggregate(undefined);
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [provider, productId, inputItems, showAggregate, adapter]);

  const filtered = items.filter((r) => (r.rating ?? 0) >= minRating);
  const agg = aggregate;

  return (
    <section className={className} {...rest}>
      {emitJsonLd ? renderJsonLd(filtered, agg) : null}
      <div className="mx-auto w-full space-y-6">
        {showAggregate && agg ? (
          <div className="flex items-center gap-3">
            <div className="text-xl font-semibold">{agg.ratingValue.toFixed(1)} / 5</div>
            <div className="text-sm text-muted-foreground">{basedOnReviews(agg.reviewCount)}</div>
          </div>
        ) : null}
        <ul className="space-y-4">
          {filtered.map((r) => (
            <li key={r.id} className="rounded border p-4">
              <div className="flex items-start justify-between">
                <div className="font-medium">{r.author ?? FALLBACK_AUTHOR}</div>
                {typeof r.rating === "number" ? (
                  <div className="text-sm">{"★".repeat(Math.round(r.rating))}</div>
                ) : null}
              </div>
              {r.title ? <div className="mt-1 font-semibold">{r.title}</div> : null}
              {r.body ? <p className="mt-2 text-sm text-muted-foreground">{r.body}</p> : null}
              {/* i18n-exempt -- Date formatting delegated to locale settings */}
              {r.createdAt ? <div className="mt-2 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
