"use client";

import * as React from "react";

import { type CatalogProductDraftInput,slugify } from "@acme/lib/xa/catalogAdminSchema";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

export function CatalogProductsList({
  products,
  query,
  selectedSlug,
  submissionSlugs,
  submissionMax,
  monoClassName,
  onQueryChange,
  onSelect,
  onToggleSubmissionSlug,
  onNew,
}: {
  products: CatalogProductDraftInput[];
  query: string;
  selectedSlug: string | null;
  submissionSlugs: Set<string>;
  submissionMax: number;
  monoClassName?: string;
  onQueryChange: (value: string) => void;
  onSelect: (product: CatalogProductDraftInput) => void;
  onToggleSubmissionSlug: (slug: string) => void;
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
    <aside className="rounded-xl border border-border-2 bg-surface p-4 shadow-elevation-1">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-label-lg text-gate-muted">
          {t("products")}
        </div>
        <button
          type="button"
          onClick={onNew}
          // eslint-disable-next-line ds/min-tap-size -- XAUP-0001 operator-desktop-tool
          className="rounded-md border border-border-2 px-3 py-1 text-xs uppercase tracking-label text-gate-ink"
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
          className="mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink placeholder:text-gate-muted focus:border-gate-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-ink/20"
          placeholder={t("searchPlaceholder")}
        />
      </label>

      <div className="mt-4 space-y-2 text-sm">
        {filtered.length === 0 ? (
          <div className="text-gate-muted">{t("noProductsFound")}</div>
        ) : null}
        {filtered.map((product) => {
          const slug = slugify(product.slug || product.title);
          const selected = selectedSlug === slug;
          const inSubmission = Boolean(slug && submissionSlugs.has(slug));
          const submissionFull = submissionSlugs.size >= submissionMax;
          const disableAdd = Boolean(slug && !inSubmission && submissionFull);
          return (
            <div
              key={slug || product.title}
              className={`flex items-stretch gap-2 rounded-md border px-3 py-2 transition ${
                selected
                  ? "border-gate-ink bg-muted"
                  : "border-border-2 bg-surface hover:bg-muted"
              }`}
            >
              <label
                className="flex w-5 flex-col items-center justify-center"
                title={t("selectForSubmission")}
              >
                <input
                  type="checkbox"
                  checked={inSubmission}
                  disabled={disableAdd}
                  aria-label={t("selectForSubmission")}
                  data-testid={slug ? `catalog-submission-checkbox-${slug}` : undefined}
                  onChange={() => {
                    if (!slug) return;
                    onToggleSubmissionSlug(slug);
                  }}
                />
              </label>

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
                {disableAdd ? (
                  <div className="mt-1 text-xs text-gate-muted">
                    {t("selectionLimitReached", { max: submissionMax })}
                  </div>
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
