"use client";

/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] legacy uploader form pending design token refactor */

import * as React from "react";

import { slugify, type CatalogProductDraftInput } from "../../lib/catalogAdminSchema";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

export function CatalogProductBaseFields({
  draft,
  fieldErrors,
  monoClassName,
  onChange,
}: {
  draft: CatalogProductDraftInput;
  fieldErrors: Record<string, string>;
  monoClassName?: string;
  onChange: (next: CatalogProductDraftInput) => void;
}) {
  const { t } = useUploaderI18n();
  const createdAtValue = (() => {
    if (!draft.createdAt) return "";
    const parsed = new Date(draft.createdAt);
    if (Number.isNaN(parsed.getTime())) return "";
    const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  })();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] md:col-span-2">
        {t("fieldTitle")}
        <input
          value={draft.title}
          onChange={(event) => {
            const title = event.target.value;
            onChange({
              ...draft,
              title,
              slug: draft.slug ? draft.slug : slugify(title),
            });
          }}
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
        {fieldErrors.title ? (
          <div className="mt-1 text-xs text-red-700">{fieldErrors.title}</div>
        ) : null}
      </label>

      <label
        className={`block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] ${monoClassName}`}
      >
        {t("fieldSlug")}
        <input
          value={draft.slug ?? ""}
          onChange={(event) => onChange({ ...draft, slug: slugify(event.target.value) })}
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldPrice")}
        <input
          value={String(draft.price ?? "")}
          onChange={(event) => onChange({ ...draft, price: event.target.value })}
          type="number"
          min="0"
          step="0.01"
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
        {fieldErrors.price ? (
          <div className="mt-1 text-xs text-red-700">{fieldErrors.price}</div>
        ) : null}
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldCompareAtPrice")}
        <input
          value={draft.compareAtPrice ? String(draft.compareAtPrice) : ""}
          onChange={(event) => onChange({ ...draft, compareAtPrice: event.target.value })}
          type="number"
          min="0"
          step="0.01"
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldBrandHandle")}
        <input
          value={draft.brandHandle ?? ""}
          onChange={(event) => onChange({ ...draft, brandHandle: slugify(event.target.value) })}
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
        {fieldErrors.brandHandle ? (
          <div className="mt-1 text-xs text-red-700">{fieldErrors.brandHandle}</div>
        ) : null}
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldBrandName")}
        <input
          value={draft.brandName ?? ""}
          onChange={(event) => onChange({ ...draft, brandName: event.target.value })}
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldCollectionHandle")}
        <input
          value={draft.collectionHandle ?? ""}
          onChange={(event) =>
            onChange({ ...draft, collectionHandle: slugify(event.target.value) })
          }
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
        {fieldErrors.collectionHandle ? (
          <div className="mt-1 text-xs text-red-700">{fieldErrors.collectionHandle}</div>
        ) : null}
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldCollectionTitle")}
        <input
          value={draft.collectionTitle ?? ""}
          onChange={(event) => onChange({ ...draft, collectionTitle: event.target.value })}
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] md:col-span-2">
        {t("fieldCollectionDescription")}
        <textarea
          value={draft.collectionDescription ?? ""}
          onChange={(event) => onChange({ ...draft, collectionDescription: event.target.value })}
          rows={2}
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] md:col-span-2">
        {t("fieldDescription")}
        <textarea
          value={draft.description ?? ""}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          rows={3}
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
        {fieldErrors.description ? (
          <div className="mt-1 text-xs text-red-700">{fieldErrors.description}</div>
        ) : null}
      </label>

      <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("fieldDepartment")}
          <select
            value={draft.taxonomy.department}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, department: event.target.value as never },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
          >
            <option value="women">{t("departmentWomen")}</option>
            <option value="men">{t("departmentMen")}</option>
          </select>
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("fieldCategoryProductType")}
          <select
            value={draft.taxonomy.category}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, category: event.target.value as never },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
          >
            <option value="clothing">{t("categoryClothing")}</option>
            <option value="bags">{t("categoryBags")}</option>
            <option value="jewelry">{t("categoryJewelry")}</option>
          </select>
        </label>
      </div>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldSubcategory")}
        <input
          value={draft.taxonomy.subcategory ?? ""}
          onChange={(event) =>
            onChange({
              ...draft,
              taxonomy: { ...draft.taxonomy, subcategory: slugify(event.target.value) },
            })
          }
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
        {fieldErrors["taxonomy.subcategory"] ? (
          <div className="mt-1 text-xs text-red-700">{fieldErrors["taxonomy.subcategory"]}</div>
        ) : null}
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldColors")}
        <input
          value={draft.taxonomy.color ?? ""}
          onChange={(event) =>
            onChange({ ...draft, taxonomy: { ...draft.taxonomy, color: event.target.value } })
          }
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
        {fieldErrors["taxonomy.color"] ? (
          <div className="mt-1 text-xs text-red-700">{fieldErrors["taxonomy.color"]}</div>
        ) : null}
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldMaterials")}
        <input
          value={draft.taxonomy.material ?? ""}
          onChange={(event) =>
            onChange({ ...draft, taxonomy: { ...draft.taxonomy, material: event.target.value } })
          }
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
        />
        {fieldErrors["taxonomy.material"] ? (
          <div className="mt-1 text-xs text-red-700">{fieldErrors["taxonomy.material"]}</div>
        ) : null}
      </label>

      <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          <input
            type="checkbox"
            checked={Boolean(draft.forSale)}
            onChange={(event) => onChange({ ...draft, forSale: event.target.checked })}
          />
          {t("fieldForSale")}
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          <input
            type="checkbox"
            checked={Boolean(draft.forRental)}
            onChange={(event) => onChange({ ...draft, forRental: event.target.checked })}
          />
          {t("fieldForRental")}
        </label>
      </div>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldDeposit")}
        <input
          value={draft.deposit ? String(draft.deposit) : ""}
          onChange={(event) => onChange({ ...draft, deposit: event.target.value })}
          type="number"
          min="0"
          step="0.01"
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldStock")}
        <input
          value={draft.stock ? String(draft.stock) : ""}
          onChange={(event) => onChange({ ...draft, stock: event.target.value })}
          type="number"
          min="0"
          step="1"
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
        {t("fieldPopularity")}
        <input
          value={draft.popularity ? String(draft.popularity) : ""}
          onChange={(event) => onChange({ ...draft, popularity: event.target.value })}
          type="number"
          min="0"
          step="1"
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] md:col-span-2">
        {t("fieldCreatedAt")}
        <input
          value={createdAtValue}
          onChange={(event) => {
            const next = event.target.value ? new Date(event.target.value).toISOString() : "";
            onChange({ ...draft, createdAt: next });
          }}
          type="datetime-local"
          className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
        />
        {fieldErrors.createdAt ? (
          <div className="mt-1 text-xs text-red-700">{fieldErrors.createdAt}</div>
        ) : null}
      </label>
    </div>
  );
}
