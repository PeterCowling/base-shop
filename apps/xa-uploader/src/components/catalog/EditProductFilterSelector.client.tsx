"use client";

import * as React from "react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { type EditFilterCriteria, type EditFilterOptions, extractFilterOptions, filterCatalogProducts } from "./catalogEditFilter";
import { FIELD_LABEL_CLASS, SELECT_CLASS } from "./catalogStyles";

/** True when the compact product list should render (filters exhausted but multiple matches remain). */
function shouldShowProductList(
  criteria: EditFilterCriteria,
  options: EditFilterOptions,
  filteredCount: number,
): boolean {
  if (filteredCount <= 1) return false;
  if (criteria.color) return true;
  if (criteria.size && options.colors.length <= 1) return true;
  if (criteria.collection && options.sizes.length <= 1 && options.colors.length <= 1) return true;
  if (criteria.brand && options.collections.length <= 1 && options.sizes.length <= 1) return true;
  return false;
}

type EditProductFilterSelectorProps = {
  products: CatalogProductDraftInput[];
  onSelect: (product: CatalogProductDraftInput) => void;
  onNew: () => void;
};

function ProductCompactList({
  products,
  onSelect,
  t,
}: {
  products: CatalogProductDraftInput[];
  onSelect: (product: CatalogProductDraftInput) => void;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  if (products.length === 0) return null;
  return (
    <div className="mt-3 space-y-1">
      <div className="text-xs text-gate-muted">
        {t("editFilterMatchCount").replace("{count}", String(products.length))}
      </div>
      {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool max height */}
      <ul className="max-h-[280px] space-y-1 overflow-y-auto">
        {products.map((p) => (
          <li key={p.slug ?? p.title}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className="w-full min-h-11 min-w-11 rounded-md border border-gate-border px-3 py-2 text-start text-sm text-gate-ink transition-colors hover:border-gate-accent hover:bg-gate-accent-soft"
              data-testid={`edit-filter-product-${p.slug}`}
            >
              <span className="font-medium">{p.title || p.slug}</span>
              {p.taxonomy.color ? (
                <span className="ms-2 text-xs text-gate-muted">{p.taxonomy.color}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EditProductFilterSelector({ products, onSelect, onNew }: EditProductFilterSelectorProps) {
  const { t } = useUploaderI18n();

  const [criteria, setCriteria] = React.useState<EditFilterCriteria>({});

  const filtered = React.useMemo(
    () => filterCatalogProducts(products, criteria),
    [products, criteria],
  );

  const options = React.useMemo(
    () => extractFilterOptions(products, criteria),
    [products, criteria],
  );

  // Auto-select when exactly one product matches (or the single match changes)
  const prevSlugRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (filtered.length === 1) {
      const slug = filtered[0].slug ?? filtered[0].title;
      if (slug !== prevSlugRef.current) {
        prevSlugRef.current = slug;
        onSelect(filtered[0]);
      }
    } else {
      prevSlugRef.current = undefined;
    }
  }, [filtered, onSelect]);

  const handleBrandChange = React.useCallback((value: string) => {
    setCriteria(value ? { brand: value } : {});
  }, []);

  const handleCollectionChange = React.useCallback(
    (value: string) => {
      setCriteria((prev) => {
        const next: EditFilterCriteria = { brand: prev.brand };
        if (value) next.collection = value;
        return next;
      });
    },
    [],
  );

  const handleSizeChange = React.useCallback(
    (value: string) => {
      setCriteria((prev) => {
        const next: EditFilterCriteria = { brand: prev.brand, collection: prev.collection };
        if (value) next.size = value;
        return next;
      });
    },
    [],
  );

  const handleColorChange = React.useCallback(
    (value: string) => {
      setCriteria((prev) => {
        const next: EditFilterCriteria = {
          brand: prev.brand,
          collection: prev.collection,
          size: prev.size,
        };
        if (value) next.color = value;
        return next;
      });
    },
    [],
  );

  const handleReset = React.useCallback(() => {
    setCriteria({});
    onNew();
  }, [onNew]);

  // Auto-advance when a filter level has exactly one option.
  React.useEffect(() => {
    if (criteria.brand && !criteria.collection && options.collections.length === 1) {
      handleCollectionChange(options.collections[0]);
    } else if (criteria.collection && !criteria.size && options.sizes.length === 1) {
      handleSizeChange(options.sizes[0]);
    } else if (criteria.size && !criteria.color && options.colors.length === 1) {
      handleColorChange(options.colors[0]);
    }
  }, [criteria, options, handleCollectionChange, handleSizeChange, handleColorChange]);

  if (products.length === 0) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full min-h-11 min-w-11 rounded-md border border-gate-accent px-3 py-2 text-xs font-semibold uppercase tracking-label-lg text-gate-accent transition-colors hover:bg-gate-accent-soft"
        >
          {t("sidebarNewProduct")}
        </button>
        <div className="text-sm text-gate-muted">{t("editFilterNoProducts")}</div>
      </div>
    );
  }

  const showCollection = !!criteria.brand && options.collections.length > 1;
  const showSize = !!criteria.collection && options.sizes.length > 1;
  const showColor = !!criteria.size && options.colors.length > 1;
  const showProductList = shouldShowProductList(criteria, options, filtered.length);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleReset}
        className="w-full min-h-11 min-w-11 rounded-md border border-gate-accent px-3 py-2 text-xs font-semibold uppercase tracking-label-lg text-gate-accent transition-colors hover:bg-gate-accent-soft"
      >
        {t("sidebarNewProduct")}
      </button>

      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-label-lg text-gate-accent">
          {t("editFilterTitle")}
        </div>
        {criteria.brand ? (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-xs text-gate-muted transition-colors hover:text-gate-ink"
          >
            {t("editFilterReset")}
          </button>
        ) : null}
      </div>

      {/* Brand select */}
      <label className={FIELD_LABEL_CLASS}>
        {t("fieldBrandSelect")}
        <select
          value={criteria.brand ?? ""}
          onChange={(e) => handleBrandChange(e.target.value)}
          className={SELECT_CLASS}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="edit-filter-brand"
        >
          <option value="">{t("editFilterAllBrands")}</option>
          {options.brands.map((b) => (
            <option key={b} value={b}>
              {b === "__custom__" ? t("fieldBrandSelectCustom") : b}
            </option>
          ))}
        </select>
      </label>

      {/* Collection select */}
      {showCollection ? (
        <label className={FIELD_LABEL_CLASS}>
          {t("fieldCollectionSelect")}
          <select
            value={criteria.collection ?? ""}
            onChange={(e) => handleCollectionChange(e.target.value)}
            className={SELECT_CLASS}
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="edit-filter-collection"
          >
            <option value="">{t("editFilterAllCollections")}</option>
            {options.collections.map((c) => (
              <option key={c} value={c}>
                {c === "__custom__" ? t("fieldCollectionSelectCustom") : c}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {/* Size select */}
      {showSize ? (
        <label className={FIELD_LABEL_CLASS}>
          {t("fieldSizeSelect")}
          <select
            value={criteria.size ?? ""}
            onChange={(e) => handleSizeChange(e.target.value)}
            className={SELECT_CLASS}
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="edit-filter-size"
          >
            <option value="">{t("editFilterAllSizes")}</option>
            {options.sizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      ) : null}

      {/* Color select */}
      {showColor ? (
        <label className={FIELD_LABEL_CLASS}>
          {t("editFilterColor")}
          <select
            value={criteria.color ?? ""}
            onChange={(e) => handleColorChange(e.target.value)}
            className={SELECT_CLASS}
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="edit-filter-color"
          >
            <option value="">{t("editFilterAllColors")}</option>
            {options.colors.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      ) : null}

      {/* Compact product list for remaining matches */}
      {showProductList ? (
        <ProductCompactList products={filtered} onSelect={onSelect} t={t} />
      ) : null}

      {/* Status line */}
      {criteria.brand && filtered.length === 0 ? (
        <div className="text-sm text-gate-muted">{t("editFilterNoMatches")}</div>
      ) : null}
    </div>
  );
}
