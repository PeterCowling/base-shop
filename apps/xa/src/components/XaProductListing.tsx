"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useTranslations } from "@acme/i18n";
import type { SKU } from "@acme/types";
import {
  Button,
  Checkbox,
  Cluster,
  Grid,
  Inline,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/components/atoms";
import { type BreadcrumbItem,Breadcrumbs } from "@acme/ui/components/molecules";
import { FilterDrawer, StorefrontProductCard } from "@acme/ui/components/organisms";

import { estimateCompareAt, productHref } from "@/lib/catalog";

type SortKey =
  | "featured"
  | "best-selling"
  | "most-popular"
  | "newest"
  | "alpha-asc"
  | "alpha-desc"
  | "price-asc"
  | "price-desc";

function uniqueSizes(products: SKU[]): string[] {
  const set = new Set<string>();
  for (const product of products) {
    for (const size of product.sizes ?? []) set.add(size);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function sortProducts(products: SKU[], sort: SortKey): SKU[] {
  const copy = products.slice();
  switch (sort) {
    case "alpha-asc":
      return copy.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    case "alpha-desc":
      return copy.sort((a, b) => (b.title ?? "").localeCompare(a.title ?? ""));
    case "price-asc":
      return copy.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "price-desc":
      return copy.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "most-popular":
    case "best-selling":
      return copy.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
    case "newest":
      return copy.sort((a, b) => (b.id ?? "").localeCompare(a.id ?? ""));
    case "featured":
    default:
      return copy;
  }
}

function applyFilters(products: SKU[], sizes: string[], inStockOnly: boolean): SKU[] {
  let out = products;
  if (sizes.length > 0) {
    const sizeSet = new Set(sizes);
    out = out.filter((p) => (p.sizes ?? []).some((s) => sizeSet.has(s)));
  }
  if (inStockOnly) {
    out = out.filter((p) => (p.stock ?? 0) > 0);
  }
  return out;
}

export interface XaProductListingProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  products: SKU[];
}

export function XaProductListing({
  title,
  breadcrumbs,
  products,
}: XaProductListingProps): React.JSX.Element {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const availableSizes = React.useMemo(() => uniqueSizes(products), [products]);
  const appliedSizes = React.useMemo(
    () => searchParams.getAll("f[size]"),
    [searchParams],
  );
  const appliedInStockOnly = searchParams.get("availability") === "in-stock";
  const appliedSort = (searchParams.get("sort") as SortKey | null) ?? "featured";

  const [draftSizes, setDraftSizes] = React.useState<string[]>(appliedSizes);
  const [draftInStockOnly, setDraftInStockOnly] = React.useState(appliedInStockOnly);

  React.useEffect(() => setDraftSizes(appliedSizes), [appliedSizes]);
  React.useEffect(() => setDraftInStockOnly(appliedInStockOnly), [appliedInStockOnly]);

  const isFiltered = appliedSizes.length > 0 || appliedInStockOnly;

  const filtered = React.useMemo(() => {
    const f = applyFilters(products, appliedSizes, appliedInStockOnly);
    return sortProducts(f, appliedSort);
  }, [products, appliedSizes, appliedInStockOnly, appliedSort]);

  const updateQuery = React.useCallback(
    (next: { sizes?: string[]; inStockOnly?: boolean; sort?: SortKey }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next.sort) params.set("sort", next.sort);

      if (typeof next.inStockOnly === "boolean") {
        if (next.inStockOnly) params.set("availability", "in-stock");
        else params.delete("availability");
      }

      if (Array.isArray(next.sizes)) {
        params.delete("f[size]");
        for (const size of next.sizes) params.append("f[size]", size);
      }

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const onClearAll = React.useCallback(() => {
    setDraftSizes([]);
    setDraftInStockOnly(false);
    updateQuery({ sizes: [], inStockOnly: false });
  }, [updateQuery]);

  const toggleSize = (size: string) => {
    setDraftSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

  const sortOptions: Array<{ value: SortKey; label: string }> = [
    { value: "featured", label: t("xa.sort.featured") },
    { value: "best-selling", label: t("xa.sort.bestSelling") },
    { value: "most-popular", label: t("xa.sort.mostPopular") },
    { value: "newest", label: t("xa.sort.newest") },
    { value: "alpha-asc", label: t("xa.sort.alphaAsc") },
    { value: "alpha-desc", label: t("xa.sort.alphaDesc") },
    { value: "price-asc", label: t("xa.sort.priceAsc") },
    { value: "price-desc", label: t("xa.sort.priceDesc") },
  ];

  return (
    <main className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <Cluster gap={4} alignY="end" justify="between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-muted-foreground">
            {t("xa.plp.productCount", { count: filtered.length })}
          </p>
        </div>

        <Cluster gap={2}>
          <FilterDrawer
            title={t("xa.filters.title")}
            triggerLabel={t("xa.filters.trigger")}
            applyLabel={t("xa.filters.apply")}
            clearLabel={t("filters.clearAll")}
            onClear={() => {
              setDraftSizes([]);
              setDraftInStockOnly(false);
            }}
            onApply={() => updateQuery({ sizes: draftSizes, inStockOnly: draftInStockOnly })}
          >
            <div className="space-y-3">
              <div className="text-sm font-semibold">{t("filters.size.label")}</div>
              <Grid cols={1} gap={2} className="sm:grid-cols-2">
                {availableSizes.map((s) => (
                  <Inline key={s} asChild gap={2}>
                    <label>
                      <Checkbox
                        checked={draftSizes.includes(s)}
                        onCheckedChange={() => toggleSize(s)}
                      />
                      <span className="text-sm">{s}</span>
                    </label>
                  </Inline>
                ))}
              </Grid>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">{t("xa.filters.availability.label")}</div>
              <Inline asChild gap={2}>
                <label>
                  <Checkbox
                    checked={draftInStockOnly}
                    onCheckedChange={() => setDraftInStockOnly((v) => !v)}
                  />
                  <span className="text-sm">{t("xa.filters.availability.inStock")}</span>
                </label>
              </Inline>
            </div>
          </FilterDrawer>

          <Button
            variant="ghost"
            onClick={onClearAll}
            disabled={!isFiltered}
          >
            {t("filters.clearAll")}
          </Button>

          <div className="w-56">
            <Select
              value={appliedSort}
              onValueChange={(v) => updateQuery({ sort: v as SortKey })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("xa.sort.label") as string} />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Cluster>
      </Cluster>

      <Grid cols={2} gap={6} className="sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <StorefrontProductCard
            key={product.id}
            href={productHref(product)}
            title={product.title ?? ""}
            price={product.price ?? 0}
            compareAtPrice={estimateCompareAt(product.price)}
            images={(product.media ?? [])
              .filter((m) => m.type === "image")
              .map((m) => ({ src: m.url, alt: m.altText }))}
          />
        ))}
      </Grid>
    </main>
  );
}
