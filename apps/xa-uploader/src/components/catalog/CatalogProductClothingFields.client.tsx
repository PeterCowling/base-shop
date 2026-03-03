"use client";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

const FIELD_CLASSNAME = "mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink";
const DETAIL_FIELD_CLASSNAME = "w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink";

type ClothingTaxonomyKey = "occasion" | "fit" | "length" | "neckline" | "sleeveLength" | "pattern";
type ClothingDetailsKey = "modelHeight" | "modelSize" | "fabricFeel" | "care" | "fitNote" | "sizeGuide";
type Translate = ReturnType<typeof useUploaderI18n>["t"];

function ClothingInputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="block text-xs uppercase tracking-label text-gate-muted">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASSNAME} />
    </label>
  );
}

function ClothingTaxonomySection({
  t,
  draft,
  onTaxonomyChange,
}: {
  t: Translate;
  draft: CatalogProductDraftInput;
  onTaxonomyChange: (field: ClothingTaxonomyKey, value: string) => void;
}) {
  return (
    <>
      <ClothingInputField
        label={t("clothingOccasion")}
        value={draft.taxonomy.occasion ?? ""}
        onChange={(nextValue) => onTaxonomyChange("occasion", nextValue)}
      />

      <ClothingInputField
        label={t("clothingFit")}
        value={draft.taxonomy.fit ?? ""}
        onChange={(nextValue) => onTaxonomyChange("fit", nextValue)}
      />

      <ClothingInputField
        label={t("clothingLength")}
        value={draft.taxonomy.length ?? ""}
        onChange={(nextValue) => onTaxonomyChange("length", nextValue)}
      />

      <ClothingInputField
        label={t("clothingNeckline")}
        value={draft.taxonomy.neckline ?? ""}
        onChange={(nextValue) => onTaxonomyChange("neckline", nextValue)}
      />

      <ClothingInputField
        label={t("clothingSleeveLength")}
        value={draft.taxonomy.sleeveLength ?? ""}
        onChange={(nextValue) => onTaxonomyChange("sleeveLength", nextValue)}
      />

      <ClothingInputField
        label={t("clothingPattern")}
        value={draft.taxonomy.pattern ?? ""}
        onChange={(nextValue) => onTaxonomyChange("pattern", nextValue)}
      />
    </>
  );
}

function ClothingDetailsSection({
  t,
  draft,
  onDetailChange,
}: {
  t: Translate;
  draft: CatalogProductDraftInput;
  onDetailChange: (field: ClothingDetailsKey, value: string) => void;
}) {
  return (
    <label className="block text-xs uppercase tracking-label text-gate-muted md:col-span-2">
      {t("clothingDetailsTitle")}
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <input
          value={draft.details?.modelHeight ?? ""}
          onChange={(event) => onDetailChange("modelHeight", event.target.value)}
          className={DETAIL_FIELD_CLASSNAME}
          placeholder={t("placeholderModelHeight")}
        />
        <input
          value={draft.details?.modelSize ?? ""}
          onChange={(event) => onDetailChange("modelSize", event.target.value)}
          className={DETAIL_FIELD_CLASSNAME}
          placeholder={t("placeholderModelSize")}
        />
        <input
          value={draft.details?.fabricFeel ?? ""}
          onChange={(event) => onDetailChange("fabricFeel", event.target.value)}
          className={DETAIL_FIELD_CLASSNAME}
          placeholder={t("placeholderFabricFeel")}
        />
        <input
          value={draft.details?.care ?? ""}
          onChange={(event) => onDetailChange("care", event.target.value)}
          className={DETAIL_FIELD_CLASSNAME}
          placeholder={t("placeholderCare")}
        />
        <textarea
          value={draft.details?.fitNote ?? ""}
          onChange={(event) => onDetailChange("fitNote", event.target.value)}
          rows={2}
          className={`md:col-span-2 ${DETAIL_FIELD_CLASSNAME}`}
          placeholder={t("placeholderFitNote")}
        />
        <textarea
          value={draft.details?.sizeGuide ?? ""}
          onChange={(event) => onDetailChange("sizeGuide", event.target.value)}
          rows={2}
          className={`md:col-span-2 ${DETAIL_FIELD_CLASSNAME}`}
          placeholder={t("placeholderSizeGuide")}
        />
      </div>
    </label>
  );
}

export function CatalogProductClothingFields({
  draft,
  fieldErrors,
  onChange,
}: {
  draft: CatalogProductDraftInput;
  fieldErrors: Record<string, string>;
  onChange: (next: CatalogProductDraftInput) => void;
}) {
  const { t } = useUploaderI18n();
  const updateTaxonomyField = (field: ClothingTaxonomyKey, value: string) => {
    onChange({
      ...draft,
      taxonomy: { ...draft.taxonomy, [field]: value },
    });
  };
  const updateDetailField = (field: ClothingDetailsKey, value: string) => {
    onChange({
      ...draft,
      details: { ...draft.details, [field]: value },
    });
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="text-xs uppercase tracking-label-lg text-gate-muted">
        {t("clothingFieldsTitle")}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("clothingSizes")}
          <input
            value={draft.sizes ?? ""}
            onChange={(event) => onChange({ ...draft, sizes: event.target.value })}
            className={FIELD_CLASSNAME}
            placeholder="S|M|L|XL"
          />
          {fieldErrors.sizes ? (
            <div className="mt-1 text-xs text-danger-fg">{fieldErrors.sizes}</div>
          ) : null}
        </label>

        <ClothingTaxonomySection t={t} draft={draft} onTaxonomyChange={updateTaxonomyField} />
        <ClothingDetailsSection t={t} draft={draft} onDetailChange={updateDetailField} />
      </div>
    </div>
  );
}
