"use client";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { INPUT_CLASS, INPUT_INLINE_CLASS } from "./catalogStyles";

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
      <input value={value} onChange={(event) => onChange(event.target.value)} className={INPUT_CLASS} />
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
    <label className="block text-xs uppercase tracking-label text-gate-muted">
      {t("clothingDetailsTitle")}
      <div className="mt-2 grid gap-3">
        <input
          value={draft.details?.modelHeight ?? ""}
          onChange={(event) => onDetailChange("modelHeight", event.target.value)}
          className={INPUT_INLINE_CLASS}
          placeholder={t("placeholderModelHeight")}
        />
        <input
          value={draft.details?.modelSize ?? ""}
          onChange={(event) => onDetailChange("modelSize", event.target.value)}
          className={INPUT_INLINE_CLASS}
          placeholder={t("placeholderModelSize")}
        />
        <input
          value={draft.details?.fabricFeel ?? ""}
          onChange={(event) => onDetailChange("fabricFeel", event.target.value)}
          className={INPUT_INLINE_CLASS}
          placeholder={t("placeholderFabricFeel")}
        />
        <input
          value={draft.details?.care ?? ""}
          onChange={(event) => onDetailChange("care", event.target.value)}
          className={INPUT_INLINE_CLASS}
          placeholder={t("placeholderCare")}
        />
        <textarea
          value={draft.details?.fitNote ?? ""}
          onChange={(event) => onDetailChange("fitNote", event.target.value)}
          rows={2}
          className={INPUT_INLINE_CLASS}
          placeholder={t("placeholderFitNote")}
        />
        <textarea
          value={draft.details?.sizeGuide ?? ""}
          onChange={(event) => onDetailChange("sizeGuide", event.target.value)}
          rows={2}
          className={INPUT_INLINE_CLASS}
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
    // eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool constrained form
    <div className="mx-auto mt-8 max-w-prose space-y-4">
      <div className="text-xs uppercase tracking-label-lg text-gate-muted">
        {t("clothingFieldsTitle")}
      </div>
      <div className="grid gap-4">
        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("clothingSizes")}
          <input
            value={draft.sizes ?? ""}
            onChange={(event) => onChange({ ...draft, sizes: event.target.value })}
            className={INPUT_CLASS}
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
