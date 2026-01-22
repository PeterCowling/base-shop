"use client";

import * as React from "react";

import { Grid as DSGrid } from "@acme/design-system/primitives/Grid";
import { Inline } from "@acme/design-system/primitives/Inline";
import { useTranslations } from "@acme/i18n";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";
import { ProductCard } from "@acme/ui/components/organisms/ProductCard";

export interface CrossSellRules {
  seedId?: string;
  includeForRental?: boolean;
  onlyInStock?: boolean;
  maxItems?: number;
}

export interface CrossSellSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  rules?: CrossSellRules;
  layout?: "grid" | "carousel";
}

export default function CrossSellSection({ rules = {}, layout = "grid", className, ...rest }: CrossSellSectionProps) {
  const t = useTranslations();
  const { seedId, includeForRental = true, onlyInStock = true, maxItems = 8 } = rules;
  let pool = [...PRODUCTS] as SKU[];
  if (seedId) pool = pool.filter((p) => p.id !== seedId);
  if (!includeForRental) pool = pool.filter((p) => !p.forRental);
  if (onlyInStock) pool = pool.filter((p) => (p.stock ?? 0) > 0);
  const items = pool.slice(0, Math.max(1, Math.min(24, maxItems)));

  if (!items.length) return null;

  if (layout === "grid") {
    return (
      <section className={className} {...rest}>
        <div className="mx-auto px-4">
          <h3 className="mb-4 text-lg font-semibold">{t("cms.blocks.crossSell.heading")}</h3>
          <DSGrid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </DSGrid>
        </div>
      </section>
    );
  }
  // Carousel fallback: simple horizontal scroll
  return (
    <section className={className} {...rest}>
      <div className="mx-auto px-4">
        <h3 className="mb-4 text-lg font-semibold">{t("cms.blocks.crossSell.heading")}</h3>
        <Inline gap={4} className="snap-x snap-mandatory overflow-x-auto pb-4">
          {items.map((p) => (
            <div key={p.id} className="snap-start grow-0 shrink-0 basis-72">
              <ProductCard product={p} />
            </div>
          ))}
        </Inline>
      </div>
    </section>
  );
}
