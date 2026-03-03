"use client";

import * as React from "react";

import { type CatalogProductDraftInput, slugify } from "@acme/lib/xa/catalogAdminSchema";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { BTN_ACCENT_OUTLINE_CLASS, INPUT_CLASS } from "./catalogStyles";
import { getCatalogDraftWorkflowReadiness } from "./catalogWorkflow";

export function CatalogProductsList({
  products,
  query,
  selectedSlug,
  monoClassName,
  onQueryChange,
  onSelect,
  onNew,
}: {
  products: CatalogProductDraftInput[];
  query: string;
  selectedSlug: string | null;
  monoClassName?: string;
  onQueryChange: (value: string) => void;
  onSelect: (product: CatalogProductDraftInput) => void;
  onNew: () => void;
}) {
  const { t } = useUploaderI18n();
  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) => {
      const slug = (p.slug ?? "").toLowerCase();
      const title = (p.title ?? "").toLowerCase();
      return slug.includes(needle) || title.includes(needle);
    });
  }, [products, query]);

  return (
    <aside className="rounded-xl border border-border-2 bg-gate-surface p-4 shadow-elevation-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-label-lg text-gate-muted">
          {t("products")}
        </div>
        <button
          type="button"
          onClick={onNew}
           
          className={BTN_ACCENT_OUTLINE_CLASS}
        >
          {t("new")}
        </button>
      </div>

      <label className="mt-3 block text-xs uppercase tracking-label text-gate-muted">
        {t("search")}
        <input
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className={INPUT_CLASS}
          placeholder={t("searchPlaceholder")}
        />
      </label>

      <div className="mt-4 space-y-2 text-sm">
        {filtered.length === 0 ? (
          <div className="text-gate-muted">{t("noProductsFound")}</div>
        ) : null}
        {filtered.map((product) => {
          const slug = slugify(product.slug || product.title);
          const readiness = getCatalogDraftWorkflowReadiness(product);
          const publishState = product.publishState ?? "draft";
          const selected = selectedSlug === slug;
          const statusLabel =
            publishState === "live"
              ? t("workflowLive")
              : readiness.isPublishReady
                ? t("workflowReadyForLive")
                : readiness.isDataReady
                  ? t("workflowDraftOnly")
                  : t("workflowDataRequired");
          const dotClass =
            publishState === "live"
              ? "bg-gate-status-ready"
              : readiness.isPublishReady
                ? "bg-gate-status-ready"
                : readiness.isDataReady
                  ? "bg-gate-status-draft"
                  : "bg-gate-status-incomplete";
          return (
            <div
              key={slug || product.title}
              className={`rounded-md border-l-2 border px-3 py-2 transition ${
                selected
                  ? "border-l-gate-accent border-border-2 bg-gate-accent-soft"
                  : "border-l-transparent border-border-2 bg-gate-input hover:bg-muted hover:border-l-gate-accent/40"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(product)}
                // eslint-disable-next-line ds/min-tap-size -- XAUP-0001 operator-desktop-tool
                className="flex-1 text-start"
              >
                <div className="text-gate-ink">{product.title}</div>
                <div
                  className={`mt-1 text-2xs uppercase tracking-label text-gate-muted ${monoClassName}`}
                >
                  {slug}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gate-muted">
                  <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
                  {statusLabel}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
