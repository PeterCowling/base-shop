"use client";

import * as React from "react";

import { useTranslations } from "@acme/i18n";
import type { SKU } from "@acme/types";
import type { RecommendationPreset } from "@acme/types/recommendations";

import { ProductCard } from "../../organisms/ProductCard";
import { RecommendationCarousel } from "../../organisms/RecommendationCarousel";

export interface ShowcaseSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  preset?: RecommendationPreset;
  layout?: "carousel" | "grid";
  limit?: number;
  endpoint?: string; // override API endpoint
  gridCols?: 2 | 3 | 4;
}

function LoadingRecommendations() {
  const t = useTranslations();
  return <div className="text-sm text-muted-foreground">{t("cms.showcase.loadingRecs")}</div>;
}

function ErrorRecommendations() {
  const t = useTranslations();
  return <div className="text-sm text-destructive">{t("cms.showcase.loadFailedRecs")}</div>;
}

function ShowcaseGrid({ preset, limit, endpoint, gridCols, className, ...rest }: Required<Pick<ShowcaseSectionProps, "preset" | "limit" | "endpoint" | "gridCols">> & React.HTMLAttributes<HTMLDivElement>) {
  const t = useTranslations();
  const [items, setItems] = React.useState<SKU[]>([]);
  const [status, setStatus] = React.useState<'idle'|'loading'|'loaded'|'error'>('idle');
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
        <div className="text-sm text-muted-foreground">{t("cms.builder.loading")}</div>
      </div>
    </section>
  );
  if (status === 'error') return (
    <section className={className} {...rest}>
      <div className="mx-auto px-4">
        <div className="text-sm text-destructive">{t("cms.showcase.loadFailedProducts")}</div>
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
  if (layout === "carousel") {
    const url = `${endpoint}?preset=${encodeURIComponent(preset)}&limit=${encodeURIComponent(String(limit))}`;
    return (
      <section className={className} {...rest}>
        <div className="mx-auto px-4">
          <RecommendationCarousel
            endpoint={url}
            minItems={1}
            maxItems={4}
            LoadingState={LoadingRecommendations}
            ErrorState={ErrorRecommendations}
          />
        </div>
      </section>
    );
  }
  return (
    <ShowcaseGrid preset={preset} limit={limit} endpoint={endpoint} gridCols={gridCols} className={className} {...rest} />
  );
}
