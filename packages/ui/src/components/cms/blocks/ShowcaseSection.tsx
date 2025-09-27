"use client";

import * as React from "react";
import type { SKU } from "@acme/types";
import type { RecommendationPreset } from "@acme/types/recommendations";
import { RecommendationCarousel } from "../../organisms/RecommendationCarousel";
import { ProductCard } from "../../organisms/ProductCard";

export interface ShowcaseSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  preset?: RecommendationPreset;
  layout?: "carousel" | "grid";
  limit?: number;
  endpoint?: string; // override API endpoint
  gridCols?: 2 | 3 | 4;
}

function ShowcaseGrid({ preset, limit, endpoint, gridCols, className, ...rest }: Required<Pick<ShowcaseSectionProps, "preset" | "limit" | "endpoint" | "gridCols">> & React.HTMLAttributes<HTMLDivElement>) {
  const [items, setItems] = React.useState<SKU[]>([]);
  const [status, setStatus] = React.useState<'idle'|'loading'|'loaded'|'error'>('idle');
  // i18n-exempt -- Loading/error microcopy; pending i18n integration
  const LOADING_TEXT = "Loading…";
  // i18n-exempt -- Loading/error microcopy; pending i18n integration
  const LOAD_ERR_PRODUCTS = "Failed to load products.";
  React.useEffect(() => {
    const load = async () => {
      try {
        setStatus('loading');
        const res = await fetch(`${endpoint}?preset=${encodeURIComponent(preset)}&limit=${encodeURIComponent(String(limit))}`);
        if (!res.ok) { setStatus('error'); return; }
        const data = (await res.json()) as SKU[];
        setItems(data);
        setStatus('loaded');
      } catch {
        setStatus('error');
      }
    };
    void load();
  }, [preset, limit, endpoint]);

  if (status === 'loading') return (
    <section className={className} {...rest}>
      <div className="mx-auto px-4">
        <div className="text-sm text-neutral-600">{LOADING_TEXT}</div>
      </div>
    </section>
  );
  if (status === 'error') return (
    <section className={className} {...rest}>
      <div className="mx-auto px-4">
        <div className="text-sm text-red-600">{LOAD_ERR_PRODUCTS}</div>
      </div>
    </section>
  );
  if (items.length === 0) return null;

  const cols = gridCols;
  const gridColsClass = cols === 2 ? "lg:grid-cols-2" : cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <section className={className} {...rest}>
      <div className="mx-auto px-4">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-4`}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ShowcaseSection({
  preset = "featured",
  layout = "carousel",
  limit = 12,
  endpoint = "/api/recommendations",
  gridCols = 3,
  className,
  ...rest
}: ShowcaseSectionProps) {
  // i18n-exempt -- Loading/error microcopy; pending i18n integration
  const LOADING_RECS_TEXT = "Loading recommendations…";
  // i18n-exempt -- Loading/error microcopy; pending i18n integration
  const LOAD_ERR_RECS_TEXT = "Failed to load recommendations.";
  if (layout === "carousel") {
    const url = `${endpoint}?preset=${encodeURIComponent(preset)}&limit=${encodeURIComponent(String(limit))}`;
    return (
      <section className={className} {...rest}>
        <div className="mx-auto px-4">
          <RecommendationCarousel
            endpoint={url}
            minItems={1}
            maxItems={4}
            LoadingState={() => <div className="text-sm text-neutral-600">{LOADING_RECS_TEXT}</div>}
            ErrorState={() => <div className="text-sm text-red-600">{LOAD_ERR_RECS_TEXT}</div>}
          />
        </div>
      </section>
    );
  }
  return (
    <ShowcaseGrid preset={preset} limit={limit} endpoint={endpoint} gridCols={gridCols} className={className} {...rest} />
  );
}
