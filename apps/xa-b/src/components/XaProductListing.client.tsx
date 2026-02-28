"use client";


import { useState } from "react";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/design-system/atoms";
import { Grid as LayoutGrid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";
import { Breadcrumbs } from "@acme/design-system/molecules";
import { Inline } from "@acme/design-system/primitives/Inline";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

import { useCart } from "../contexts/XaCartContext";
import type { XaProduct } from "../lib/demoData";
import { siteConfig } from "../lib/siteConfig";
import { useXaListingFilters } from "../lib/useXaListingFilters";
import type { SortKey } from "../lib/xaFilters";
import { xaI18n } from "../lib/xaI18n";
import type { XaCategory } from "../lib/xaTypes";

import { XaFilterChip } from "./XaFilterChip";
import { XaFiltersDrawer } from "./XaFiltersDrawer.client";
import { XaProductCard } from "./XaProductCard";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  "price-asc": "Price (low to high)",
  "price-desc": "Price (high to low)",
  "best-sellers": "Best sellers",
  "biggest-discount": xaI18n.t("xaB.src.components.xaproductlisting.client.l35c23"),
};

export function XaProductListing({
  title,
  breadcrumbs,
  products,
  category,
  showTypeFilter = true,
}: {
  title: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  products: XaProduct[];
  category?: XaCategory;
  showTypeFilter?: boolean;
}) {
  const [cart] = useCart();
  const [currency] = useCurrency();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    sort,
    applySort,
    filterConfigs,
    facetValues,
    filteredProducts,
    appliedChips,
    draftValues,
    draftInStock,
    draftSale,
    draftNewIn,
    draftMin,
    draftMax,
    setDraftInStock,
    setDraftSale,
    setDraftNewIn,
    setDraftMin,
    setDraftMax,
    toggleDraftValue,
    clearAllDraft,
    applyFilters,
    clearAppliedFilters,
  } = useXaListingFilters({
    products,
    category,
    showTypeFilter,
    cart,
    filtersOpen,
    currency,
  });

  return (
    <main className="sf-content">
      <Section padding="default">
        <div className="space-y-4">
          <Breadcrumbs items={breadcrumbs} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <div className="text-sm text-muted-foreground">
                {filteredProducts.length} {siteConfig.catalog.productNounPlural}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <XaFiltersDrawer
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filterConfigs={filterConfigs}
                facetValues={facetValues}
                draftValues={draftValues}
                draftInStock={draftInStock}
                draftSale={draftSale}
                draftNewIn={draftNewIn}
                draftMin={draftMin}
                draftMax={draftMax}
                onToggleValue={toggleDraftValue}
                onChangeInStock={setDraftInStock}
                onChangeSale={setDraftSale}
                onChangeNewIn={setDraftNewIn}
                onChangeMin={setDraftMin}
                onChangeMax={setDraftMax}
                onClear={clearAllDraft}
                onApply={() => {
                  applyFilters();
                  setFiltersOpen(false);
                }}
              />

              <div className="min-w-56">
                <Select value={sort} onValueChange={(value) => applySort(value as SortKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue aria-label={SORT_LABELS[sort] ?? sort} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-asc">{xaI18n.t("xaB.src.components.xaproductlisting.client.l144c51")}</SelectItem>
                    <SelectItem value="price-desc">{xaI18n.t("xaB.src.components.xaproductlisting.client.l145c52")}</SelectItem>
                    <SelectItem value="best-sellers">Best sellers</SelectItem>
                    <SelectItem value={xaI18n.t("xaB.src.components.xaproductlisting.client.l147c39")}>{xaI18n.t("xaB.src.components.xaproductlisting.client.l147c58")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {appliedChips.length ? (
            <Inline gap={2} className="flex-wrap">
              {appliedChips.map((chip) => (
                <XaFilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
              ))}
            </Inline>
          ) : null}
        </div>
      </Section>

      <Section padding="default">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.components.xaproductlisting.client.l167c58")}</p>
            <Button
              type="button"
              onClick={clearAppliedFilters}
              variant="outline"
              size="sm"
              className="h-auto min-h-0 rounded-none border border-border-2 px-4 py-2 text-xs uppercase tracking-widest hover:bg-muted"
            >{xaI18n.t("xaB.src.components.xaproductlisting.client.l174c14")}</Button>
          </div>
        ) : (
          <LayoutGrid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
            {filteredProducts.map((product) => (
              <XaProductCard key={product.slug} product={product} />
            ))}
          </LayoutGrid>
        )}
      </Section>
    </main>
  );
}
