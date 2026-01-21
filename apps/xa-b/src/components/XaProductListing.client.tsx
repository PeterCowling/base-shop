"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy listing page pending design/i18n overhaul */

import { useState } from "react";

import { Grid as LayoutGrid } from "@acme/ui/atoms/Grid";
import { Section } from "@acme/ui/atoms/Section";
import { Breadcrumbs } from "@acme/ui/components/molecules";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/components/atoms";

import { XaProductCard } from "./XaProductCard";
import { XaFiltersDrawer } from "./XaFiltersDrawer.client";
import { XaFilterChip } from "./XaFilterChip";
import type { XaProduct } from "../lib/demoData";
import type { XaCategory } from "../lib/xaTypes";
import { ALL_FILTER_KEYS, type SortKey } from "../lib/xaFilters";
import { useCart } from "../contexts/XaCartContext";
import { useXaListingFilters } from "../lib/useXaListingFilters";
import { siteConfig } from "../lib/siteConfig";

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
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    sort,
    applySort,
    filterConfigs,
    facetValues,
    filteredProducts,
    appliedChips,
    hasAppliedFilters,
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
  });

  const draftHasSelections =
    draftInStock ||
    draftSale ||
    draftNewIn ||
    Boolean(draftMin.trim() || draftMax.trim()) ||
    ALL_FILTER_KEYS.some((key) => draftValues[key].size > 0);

  const effectiveFiltersOpen = filtersOpen || hasAppliedFilters;

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
                open={effectiveFiltersOpen}
                onOpenChange={(next) => {
                  // Keep the drawer visible while filters are applied; allow closing once none remain.
                  if (!next && hasAppliedFilters) return;
                  setFiltersOpen(next);
                }}
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
                  // Keep drawer open if a selection exists; otherwise close.
                  setFiltersOpen(draftHasSelections);
                }}
              />

              <div className="min-w-56">
                <Select value={sort} onValueChange={(value) => applySort(value as SortKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue aria-label={sort} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-asc">Price (low to high)</SelectItem>
                    <SelectItem value="price-desc">Price (high to low)</SelectItem>
                    <SelectItem value="best-sellers">Best sellers</SelectItem>
                    <SelectItem value="biggest-discount">Biggest discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {appliedChips.length ? (
            <div className="flex flex-wrap gap-2">
              {appliedChips.map((chip) => (
                <XaFilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
              ))}
            </div>
          ) : null}
        </div>
      </Section>

      <Section padding="default">
        {filteredProducts.length ? (
          <LayoutGrid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
            {filteredProducts.map((product) => (
              <XaProductCard key={product.slug} product={product} />
            ))}
          </LayoutGrid>
        ) : (
          <div className="rounded-lg border p-6">
            <div className="font-medium">No {siteConfig.catalog.productNounPlural} found.</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Try adjusting filters, or clear them to see more results.
            </div>
            {hasAppliedFilters ? (
              <div className="mt-4">
                <Button variant="outline" onClick={clearAppliedFilters}>
                  Clear filters
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </Section>
    </main>
  );
}
