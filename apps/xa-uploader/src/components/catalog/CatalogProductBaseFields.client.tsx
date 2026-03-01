"use client";

import * as React from "react";

import { type CatalogProductDraftInput,slugify } from "@acme/lib/xa/catalogAdminSchema";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

type BaseFieldsProps = {
  draft: CatalogProductDraftInput;
  fieldErrors: Record<string, string>;
  monoClassName?: string;
  onChange: (next: CatalogProductDraftInput) => void;
};

type Translate = ReturnType<typeof useUploaderI18n>["t"];

const INPUT_CLASSNAME =
  "mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink focus:border-gate-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-ink/20";
const INPUT_SIMPLE_CLASSNAME =
  "mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="mt-1 text-xs text-danger-fg">{message}</div>;
}

function toDateTimeLocalValue(value: string | undefined): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function IdentityFields({
  t,
  draft,
  fieldErrors,
  monoClassName,
  onChange,
}: BaseFieldsProps & { t: Translate }) {
  return (
    <>
      <label className="block text-xs uppercase tracking-label text-gate-muted md:col-span-2">
        {t("fieldTitle")}
        <input
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-field-title"
          value={draft.title}
          onChange={(event) => {
            const title = event.target.value;
            onChange({
              ...draft,
              title,
              slug: draft.slug ? draft.slug : slugify(title),
            });
          }}
          className={INPUT_CLASSNAME}
        />
        <FieldError message={fieldErrors.title} />
      </label>

      <label className={`block text-xs uppercase tracking-label text-gate-muted ${monoClassName}`}>
        {t("fieldSlug")}
        <input
          value={draft.slug ?? ""}
          onChange={(event) => onChange({ ...draft, slug: slugify(event.target.value) })}
          className={INPUT_CLASSNAME}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldPrice")}
        <input
          value={String(draft.price ?? "")}
          onChange={(event) => onChange({ ...draft, price: event.target.value })}
          type="number"
          min="0"
          step="0.01"
          className={INPUT_CLASSNAME}
        />
        <FieldError message={fieldErrors.price} />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldCompareAtPrice")}
        <input
          value={draft.compareAtPrice ? String(draft.compareAtPrice) : ""}
          onChange={(event) => onChange({ ...draft, compareAtPrice: event.target.value })}
          type="number"
          min="0"
          step="0.01"
          className={INPUT_CLASSNAME}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldBrandHandle")}
        <input
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-field-brand-handle"
          value={draft.brandHandle ?? ""}
          onChange={(event) => onChange({ ...draft, brandHandle: slugify(event.target.value) })}
          className={INPUT_CLASSNAME}
        />
        <FieldError message={fieldErrors.brandHandle} />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldBrandName")}
        <input
          value={draft.brandName ?? ""}
          onChange={(event) => onChange({ ...draft, brandName: event.target.value })}
          className={INPUT_CLASSNAME}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldCollectionHandle")}
        <input
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-field-collection-handle"
          value={draft.collectionHandle ?? ""}
          onChange={(event) => onChange({ ...draft, collectionHandle: slugify(event.target.value) })}
          className={INPUT_CLASSNAME}
        />
        <FieldError message={fieldErrors.collectionHandle} />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldCollectionTitle")}
        <input
          value={draft.collectionTitle ?? ""}
          onChange={(event) => onChange({ ...draft, collectionTitle: event.target.value })}
          className={INPUT_CLASSNAME}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted md:col-span-2">
        {t("fieldCollectionDescription")}
        <textarea
          value={draft.collectionDescription ?? ""}
          onChange={(event) => onChange({ ...draft, collectionDescription: event.target.value })}
          rows={2}
          className={INPUT_CLASSNAME}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted md:col-span-2">
        {t("fieldDescription")}
        <textarea
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-field-description"
          value={draft.description ?? ""}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          rows={3}
          className={INPUT_CLASSNAME}
        />
        <FieldError message={fieldErrors.description} />
      </label>
    </>
  );
}

function TaxonomyFields({ t, draft, fieldErrors, onChange }: BaseFieldsProps & { t: Translate }) {
  return (
    <>
      <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("fieldDepartment")}
          <select
            value={draft.taxonomy.department}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, department: event.target.value as never },
              })
            }
            className={INPUT_CLASSNAME}
          >
            <option value="women">{t("departmentWomen")}</option>
            <option value="men">{t("departmentMen")}</option>
            <option value="kids">{t("departmentKids")}</option>
          </select>
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("fieldCategoryProductType")}
          <select
            value={draft.taxonomy.category}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, category: event.target.value as never },
              })
            }
            className={INPUT_CLASSNAME}
          >
            <option value="clothing">{t("categoryClothing")}</option>
            <option value="bags">{t("categoryBags")}</option>
            <option value="jewelry">{t("categoryJewelry")}</option>
          </select>
        </label>
      </div>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldSubcategory")}
        <input
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-field-subcategory"
          value={draft.taxonomy.subcategory ?? ""}
          onChange={(event) =>
            onChange({
              ...draft,
              taxonomy: { ...draft.taxonomy, subcategory: slugify(event.target.value) },
            })
          }
          className={INPUT_CLASSNAME}
        />
        <FieldError message={fieldErrors["taxonomy.subcategory"]} />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldColors")}
        <input
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-field-colors"
          value={draft.taxonomy.color ?? ""}
          onChange={(event) =>
            onChange({ ...draft, taxonomy: { ...draft.taxonomy, color: event.target.value } })
          }
          className={INPUT_CLASSNAME}
        />
        <FieldError message={fieldErrors["taxonomy.color"]} />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldMaterials")}
        <input
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-field-materials"
          value={draft.taxonomy.material ?? ""}
          onChange={(event) =>
            onChange({ ...draft, taxonomy: { ...draft.taxonomy, material: event.target.value } })
          }
          className={INPUT_CLASSNAME}
        />
        <FieldError message={fieldErrors["taxonomy.material"]} />
      </label>

      <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
        <label className="flex items-center gap-2 text-xs uppercase tracking-label text-gate-muted">
          <input
            type="checkbox"
            checked={Boolean(draft.forSale)}
            onChange={(event) => onChange({ ...draft, forSale: event.target.checked })}
          />
          {t("fieldForSale")}
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-label text-gate-muted">
          <input
            type="checkbox"
            checked={Boolean(draft.forRental)}
            onChange={(event) => onChange({ ...draft, forRental: event.target.checked })}
          />
          {t("fieldForRental")}
        </label>
      </div>
    </>
  );
}

function CommercialFields({ t, draft, fieldErrors, onChange }: BaseFieldsProps & { t: Translate }) {
  const createdAtValue = toDateTimeLocalValue(draft.createdAt);

  return (
    <>
      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldDeposit")}
        <input
          value={draft.deposit ? String(draft.deposit) : ""}
          onChange={(event) => onChange({ ...draft, deposit: event.target.value })}
          type="number"
          min="0"
          step="0.01"
          className={INPUT_SIMPLE_CLASSNAME}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldStock")}
        <input
          value={draft.stock ? String(draft.stock) : ""}
          onChange={(event) => onChange({ ...draft, stock: event.target.value })}
          type="number"
          min="0"
          step="1"
          className={INPUT_SIMPLE_CLASSNAME}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldPopularity")}
        <input
          value={draft.popularity ? String(draft.popularity) : ""}
          onChange={(event) => onChange({ ...draft, popularity: event.target.value })}
          type="number"
          min="0"
          step="1"
          className={INPUT_SIMPLE_CLASSNAME}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted md:col-span-2">
        {t("fieldCreatedAt")}
        <input
          value={createdAtValue}
          onChange={(event) => {
            const next = event.target.value ? new Date(event.target.value).toISOString() : "";
            onChange({ ...draft, createdAt: next });
          }}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 operator-tool input-type
          type="datetime-local"
          className={INPUT_SIMPLE_CLASSNAME}
        />
        <FieldError message={fieldErrors.createdAt} />
      </label>
    </>
  );
}

export function CatalogProductBaseFields(props: BaseFieldsProps) {
  const { t } = useUploaderI18n();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <IdentityFields {...props} t={t} />
      <TaxonomyFields {...props} t={t} />
      <CommercialFields {...props} t={t} />
    </div>
  );
}
