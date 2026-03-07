"use client";

import * as React from "react";

import { type CatalogProductDraftInput, joinList, slugify, splitList } from "@acme/lib/xa/catalogAdminSchema";

import {
  computePopularity,
  CUSTOM_BRAND_HANDLE,
  CUSTOM_COLLECTION_HANDLE,
  findBrand,
  findCollection,
  findCollectionColors,
  findCollectionDefaults,
  findCollectionHardwareColors,
  findCollectionInteriorColors,
  findCollectionMaterials,
  findCollectionSizes,
  XA_BRAND_REGISTRY,
  ZH_CATALOG_LABELS,
} from "../../lib/catalogBrandRegistry";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { INPUT_CLASS, SECTION_HEADER_CLASS, SELECT_CLASS } from "./catalogStyles";
import { RegistryCheckboxGrid } from "./RegistryCheckboxGrid.client";

type BaseFieldsProps = {
  selectedSlug?: string | null;
  draft: CatalogProductDraftInput;
  fieldErrors: Record<string, string>;
  monoClassName?: string;
  sections?: CatalogBaseFieldSection[];
  onChange: (next: CatalogProductDraftInput) => void;
};

type Translate = ReturnType<typeof useUploaderI18n>["t"];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="mt-1 text-xs text-danger-fg">{message}</div>;
}

type DescriptionInput = {
  brandName: string;
  collectionTitle: string;
  sizeLabel: string;
  dimensions: string;
  colors: string;
  material: string;
  promo?: string;
};

function firstFromList(value: string): string {
  return value.split(/[|,]+/).map((s) => s.trim()).filter(Boolean)[0] ?? "";
}

function generateTitle(input: DescriptionInput): string {
  const color = firstFromList(input.colors);
  const material = firstFromList(input.material);
  const parts = [input.brandName, input.collectionTitle, input.sizeLabel];
  if (color) parts.push(color);
  if (material) parts.push(material);
  return parts.filter(Boolean).join(" ");
}

function generateDescription(input: DescriptionInput): string {
  const firstColor = firstFromList(input.colors);
  const firstMaterial = firstFromList(input.material);

  let suffix = "";
  if (firstColor && firstMaterial) suffix = `in ${firstColor} ${firstMaterial} leather`;
  else if (firstColor) suffix = `in ${firstColor}`;
  else if (firstMaterial) suffix = `in ${firstMaterial} leather`;

  const headline = [input.brandName, input.collectionTitle, input.sizeLabel, suffix].filter(Boolean).join(" ");
  const parts = [`${headline}. ${input.dimensions}.`];
  if (input.promo) parts.push("", input.promo);
  return parts.join("\n");
}

function deriveInitialBrandSelection(brandHandle: string | undefined): string {
  if (!brandHandle) return "";
  return findBrand(brandHandle) ? brandHandle : CUSTOM_BRAND_HANDLE;
}

function deriveInitialCollectionSelection(
  brandHandle: string | undefined,
  collectionHandle: string | undefined,
): string {
  if (!brandHandle || !collectionHandle) return "";
  if (deriveInitialBrandSelection(brandHandle) === CUSTOM_BRAND_HANDLE) return CUSTOM_COLLECTION_HANDLE;
  return findCollection(brandHandle, collectionHandle) ? collectionHandle : CUSTOM_COLLECTION_HANDLE;
}

function SizeSelector({
  t,
  draft,
  brandHandle,
  collectionHandle,
  selectedSlug,
  onChange,
}: {
  t: Translate;
  draft: CatalogProductDraftInput;
  brandHandle: string;
  collectionHandle: string;
  selectedSlug?: string | null;
  onChange: (next: CatalogProductDraftInput) => void;
}) {
  const [selectedSize, setSelectedSize] = React.useState(() => draft.sizes ?? "");
  const sizes = findCollectionSizes(brandHandle, collectionHandle);

  // Reset local state when collection changes
  React.useEffect(() => {
    setSelectedSize(draft.sizes ?? "");
  }, [draft.sizes]);

  const handleChange = React.useCallback(
    (value: string) => {
      setSelectedSize(value);
      if (!sizes) return;
      const match = sizes.find((s) => s.label === value);
      if (!match) {
        onChange({ ...draft, sizes: "", details: { ...draft.details, dimensions: "", whatFits: "", strapDrop: "" } });
        return;
      }
      const brand = findBrand(brandHandle);
      const coll = findCollection(brandHandle, collectionHandle);
      if (brand && coll) {
        const pop = computePopularity(brandHandle, collectionHandle, match.label, draft.taxonomy.color ?? "");
        if (selectedSlug == null) {
          // New product: auto-derive title, slug, description, popularity
          const input: DescriptionInput = {
            brandName: brand.name,
            collectionTitle: coll.title,
            sizeLabel: match.label,
            dimensions: match.dimensions,
            colors: draft.taxonomy.color ?? "",
            material: draft.taxonomy.material ?? "",
            promo: coll.promo,
          };
          const title = generateTitle(input);
          onChange({
            ...draft,
            sizes: match.label,
            title,
            slug: slugify(title),
            details: { ...draft.details, dimensions: match.dimensions, ...(match.whatFits ? { whatFits: match.whatFits } : {}), ...(match.strapDrop ? { strapDrop: match.strapDrop } : {}) },
            description: generateDescription(input),
            ...(pop != null ? { popularity: String(pop) } : {}),
          });
        } else {
          // Edit mode: update size-specific fields only, preserve title/slug/description
          onChange({
            ...draft,
            sizes: match.label,
            details: { ...draft.details, dimensions: match.dimensions, ...(match.whatFits ? { whatFits: match.whatFits } : {}), ...(match.strapDrop ? { strapDrop: match.strapDrop } : {}) },
            ...(pop != null ? { popularity: String(pop) } : {}),
          });
        }
      } else {
        const pop = computePopularity(brandHandle, collectionHandle, match.label, draft.taxonomy.color ?? "");
        onChange({
          ...draft,
          sizes: match.label,
          details: { ...draft.details, dimensions: match.dimensions, ...(match.whatFits ? { whatFits: match.whatFits } : {}), ...(match.strapDrop ? { strapDrop: match.strapDrop } : {}) },
          ...(pop != null ? { popularity: String(pop) } : {}),
        });
      }
    },
    [draft, onChange, brandHandle, collectionHandle, sizes, selectedSlug],
  );

  if (!sizes || sizes.length === 0) return null;

  return (
    <label className="block text-xs uppercase tracking-label text-gate-muted">
      {t("fieldSizeSelect")}
      <select
        value={selectedSize}
        onChange={(event) => handleChange(event.target.value)}
        className={SELECT_CLASS}
        // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
        data-testid="catalog-field-size-select"
      >
        <option value="">{t("fieldSizeSelectPlaceholder")}</option>
        {sizes.map((s) => (
          <option key={s.label} value={s.label}>
            {s.label} — {s.dimensions}
          </option>
        ))}
      </select>
    </label>
  );
}

function BrandCollectionSelectors({
  t,
  draft,
  fieldErrors,
  selectedSlug,
  onChange,
}: BaseFieldsProps & { t: Translate }) {
  const [selectedBrand, setSelectedBrand] = React.useState(() =>
    deriveInitialBrandSelection(draft.brandHandle),
  );
  const [selectedCollection, setSelectedCollection] = React.useState(() =>
    deriveInitialCollectionSelection(draft.brandHandle, draft.collectionHandle),
  );

  const isCustomBrand = selectedBrand === CUSTOM_BRAND_HANDLE;
  const isCustomCollection = selectedCollection === CUSTOM_COLLECTION_HANDLE;
  const activeBrand = isCustomBrand ? undefined : findBrand(selectedBrand);
  const collections = activeBrand?.collections ?? [];

  const handleBrandChange = React.useCallback(
    (value: string) => {
      if (value === CUSTOM_BRAND_HANDLE) {
        setSelectedBrand(CUSTOM_BRAND_HANDLE);
        setSelectedCollection(CUSTOM_COLLECTION_HANDLE);
        onChange({ ...draft, brandHandle: "", brandName: "", collectionHandle: "", collectionTitle: "", collectionDescription: "" });
      } else if (value === "") {
        setSelectedBrand("");
        setSelectedCollection("");
        onChange({ ...draft, brandHandle: "", brandName: "", collectionHandle: "", collectionTitle: "", collectionDescription: "" });
      } else {
        const brand = findBrand(value);
        if (brand) {
          setSelectedBrand(brand.handle);
          setSelectedCollection("");
          onChange({ ...draft, brandHandle: brand.handle, brandName: brand.name, collectionHandle: "", collectionTitle: "", collectionDescription: "" });
        }
      }
    },
    [draft, onChange],
  );

  const handleCollectionChange = React.useCallback(
    (value: string) => {
      if (value === CUSTOM_COLLECTION_HANDLE) {
        setSelectedCollection(CUSTOM_COLLECTION_HANDLE);
        onChange({ ...draft, collectionHandle: "", collectionTitle: "", collectionDescription: "", sizes: "", details: { ...draft.details, dimensions: "", strapDrop: "", whatFits: "" } });
      } else if (value === "") {
        setSelectedCollection("");
        onChange({ ...draft, collectionHandle: "", collectionTitle: "", collectionDescription: "", sizes: "", details: { ...draft.details, dimensions: "", strapDrop: "", whatFits: "" } });
      } else {
        const coll = findCollection(selectedBrand, value);
        if (coll) {
          setSelectedCollection(coll.handle);
          const defaults = findCollectionDefaults(selectedBrand, value);
          onChange({
            ...draft,
            collectionHandle: coll.handle,
            collectionTitle: coll.title,
            collectionDescription: coll.description,
            sizes: "",
            details: {
              ...draft.details,
              dimensions: "",
              strapDrop: "",
              whatFits: "",
              ...(defaults?.interior ? { interior: defaults.interior } : {}),
            },
            taxonomy: {
              ...draft.taxonomy,
              ...(defaults?.subcategory ? { subcategory: defaults.subcategory } : {}),
              ...(defaults?.department ? { department: defaults.department as never } : {}),
              ...(defaults?.closureType ? { closureType: defaults.closureType } : {}),
              ...(defaults?.strapStyle ? { strapStyle: defaults.strapStyle } : {}),
            },
          });
        }
      }
    },
    [draft, onChange, selectedBrand],
  );

  return (
    <>
      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldBrandSelect")}
        <select
          value={selectedBrand}
          onChange={(event) => handleBrandChange(event.target.value)}
          className={SELECT_CLASS}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-field-brand-select"
        >
          <option value="">{t("fieldBrandSelectPlaceholder")}</option>
          {XA_BRAND_REGISTRY.map((brand) => (
            <option key={brand.handle} value={brand.handle}>{brand.name}</option>
          ))}
          <option value={CUSTOM_BRAND_HANDLE}>{t("fieldBrandSelectCustom")}</option>
        </select>
        <FieldError message={fieldErrors.brandHandle} />
      </label>

      {selectedBrand && !isCustomBrand ? (
        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("fieldCollectionSelect")}
          <select
            value={selectedCollection}
            onChange={(event) => handleCollectionChange(event.target.value)}
            className={SELECT_CLASS}
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="catalog-field-collection-select"
          >
            <option value="">{t("fieldCollectionSelectPlaceholder")}</option>
            {collections.map((coll) => (
              <option key={coll.handle} value={coll.handle}>{coll.title}</option>
            ))}
            <option value={CUSTOM_COLLECTION_HANDLE}>{t("fieldCollectionSelectCustom")}</option>
          </select>
          <FieldError message={fieldErrors.collectionHandle} />
        </label>
      ) : null}

      {isCustomBrand ? (
        <>
          <label className="block text-xs uppercase tracking-label text-gate-muted">
            {t("fieldBrandHandle")}
            <input
              // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
              data-testid="catalog-field-brand-handle"
              value={draft.brandHandle ?? ""}
              onChange={(event) => onChange({ ...draft, brandHandle: slugify(event.target.value) })}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-xs uppercase tracking-label text-gate-muted">
            {t("fieldBrandName")}
            <input
              value={draft.brandName ?? ""}
              onChange={(event) => onChange({ ...draft, brandName: event.target.value })}
              className={INPUT_CLASS}
            />
          </label>
        </>
      ) : null}

      {isCustomCollection ? (
        <>
          <label className="block text-xs uppercase tracking-label text-gate-muted">
            {t("fieldCollectionHandle")}
            <input
              // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
              data-testid="catalog-field-collection-handle"
              value={draft.collectionHandle ?? ""}
              onChange={(event) => onChange({ ...draft, collectionHandle: slugify(event.target.value) })}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-xs uppercase tracking-label text-gate-muted">
            {t("fieldCollectionTitle")}
            <input
              value={draft.collectionTitle ?? ""}
              onChange={(event) => onChange({ ...draft, collectionTitle: event.target.value })}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-xs uppercase tracking-label text-gate-muted">
            {t("fieldCollectionDescription")}
            <textarea
              value={draft.collectionDescription ?? ""}
              onChange={(event) => onChange({ ...draft, collectionDescription: event.target.value })}
              rows={2}
              className={INPUT_CLASS}
            />
          </label>
        </>
      ) : null}

      {!isCustomBrand && !isCustomCollection ? (
        <SizeSelector
          t={t}
          draft={draft}
          brandHandle={selectedBrand}
          collectionHandle={selectedCollection}
          selectedSlug={selectedSlug}
          onChange={onChange}
        />
      ) : null}

      {selectedCollection ? (
        <MaterialColorSelectors t={t} draft={draft} fieldErrors={fieldErrors} onChange={onChange} />
      ) : null}
    </>
  );
}

function MaterialColorSelectors({
  t,
  draft,
  fieldErrors,
  onChange,
}: BaseFieldsProps & { t: Translate }) {
  const { locale } = useUploaderI18n();
  const getLabel = locale === "zh" ? (v: string) => ZH_CATALOG_LABELS[v] ?? v : undefined;
  const registryMaterials = findCollectionMaterials(draft.brandHandle ?? "", draft.collectionHandle ?? "");
  const registryColors = findCollectionColors(draft.brandHandle ?? "", draft.collectionHandle ?? "");
  const registryHardwareColors = findCollectionHardwareColors(draft.brandHandle ?? "", draft.collectionHandle ?? "");
  const registryInteriorColors = findCollectionInteriorColors(draft.brandHandle ?? "", draft.collectionHandle ?? "");

  const handleMaterialChange = React.useCallback(
    (next: string[]) => {
      onChange(maybeRegenerateDerived({ ...draft, taxonomy: { ...draft.taxonomy, material: joinList(next) } }));
    },
    [draft, onChange],
  );

  const handleColorChange = React.useCallback(
    (next: string[]) => {
      onChange(maybeRegenerateDerived({ ...draft, taxonomy: { ...draft.taxonomy, color: joinList(next) } }));
    },
    [draft, onChange],
  );

  return (
    <>
      {registryMaterials ? (
        <RegistryCheckboxGrid
          label={t("fieldMaterialsRegistry")}
          options={registryMaterials}
          selected={splitList(draft.taxonomy.material ?? "")}
          customPlaceholder=""
          fieldError={fieldErrors["taxonomy.material"]}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          testId="catalog-field-materials"
          getLabel={getLabel}
          onChange={handleMaterialChange}
        />
      ) : (
        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("fieldMaterials")}
          <input
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="catalog-field-materials"
            value={draft.taxonomy.material ?? ""}
            onChange={(event) =>
              onChange({ ...draft, taxonomy: { ...draft.taxonomy, material: event.target.value } })
            }
            className={INPUT_CLASS}
          />
          <FieldError message={fieldErrors["taxonomy.material"]} />
        </label>
      )}

      {registryColors ? (
        <RegistryCheckboxGrid
          label={t("fieldColorsRegistry")}
          options={registryColors}
          selected={splitList(draft.taxonomy.color ?? "")}
          customPlaceholder=""
          fieldError={fieldErrors["taxonomy.color"]}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          testId="catalog-field-colors"
          getLabel={getLabel}
          onChange={handleColorChange}
        />
      ) : (
        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("fieldColors")}
          <input
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="catalog-field-colors"
            value={draft.taxonomy.color ?? ""}
            onChange={(event) =>
              onChange({ ...draft, taxonomy: { ...draft.taxonomy, color: event.target.value } })
            }
            className={INPUT_CLASS}
          />
          <FieldError message={fieldErrors["taxonomy.color"]} />
        </label>
      )}

      {registryInteriorColors ? (
        <RegistryCheckboxGrid
          label={t("fieldInteriorColorRegistry")}
          options={registryInteriorColors}
          selected={splitList(draft.taxonomy.interiorColor ?? "")}
          customPlaceholder=""
          getLabel={getLabel}
          onChange={(next) =>
            onChange({ ...draft, taxonomy: { ...draft.taxonomy, interiorColor: joinList(next) } })
          }
        />
      ) : null}

      {registryHardwareColors ? (
        <RegistryCheckboxGrid
          label={t("bagHardwareColor")}
          options={registryHardwareColors}
          selected={splitList(draft.taxonomy.hardwareColor ?? "")}
          customPlaceholder=""
          getLabel={getLabel}
          onChange={(next) =>
            onChange({ ...draft, taxonomy: { ...draft.taxonomy, hardwareColor: joinList(next) } })
          }
        />
      ) : null}
    </>
  );
}

const PRICE_PATTERN = /^\d{1,4}\.\d{2}$/;

function PriceInput({ t, draft, fieldErrors, onChange }: BaseFieldsProps & { t: Translate }) {
  const raw = String(draft.price ?? "");
  const showFormatError = raw.length > 0 && !PRICE_PATTERN.test(raw);

  return (
    <label className="block text-xs uppercase tracking-label text-gate-muted">
      {t("fieldPrice")}
      <input
        value={raw}
        onChange={(event) => onChange({ ...draft, price: event.target.value })}
        type="text"
        inputMode="decimal"
        placeholder="0000.00"
        className={INPUT_CLASS}
      />
      {showFormatError ? (
        <div className="mt-1 text-xs text-danger-fg">{t("fieldPriceFormatError")}</div>
      ) : null}
      <FieldError message={fieldErrors.price} />
    </label>
  );
}

function IdentityFields({
  t,
  selectedSlug,
  draft,
  fieldErrors,
  onChange,
}: BaseFieldsProps & { t: Translate }) {
  const hasCollection = !!draft.collectionHandle;

  return (
    <>
      <BrandCollectionSelectors t={t} selectedSlug={selectedSlug} draft={draft} fieldErrors={fieldErrors} onChange={onChange} />

      {hasCollection ? (
        <>
          <StatusSelect t={t} draft={draft} onChange={onChange} />
          <PriceInput t={t} draft={draft} fieldErrors={fieldErrors} onChange={onChange} />
        </>
      ) : null}
    </>
  );
}

function maybeRegenerateDerived(
  updated: CatalogProductDraftInput,
): CatalogProductDraftInput {
  const brand = findBrand(updated.brandHandle ?? "");
  const coll = findCollection(updated.brandHandle ?? "", updated.collectionHandle ?? "");
  const sizes = findCollectionSizes(updated.brandHandle ?? "", updated.collectionHandle ?? "");
  const sizeMatch = sizes?.find((s) => s.label === updated.sizes);
  if (!brand || !coll || !sizeMatch) return updated;
  const input: DescriptionInput = {
    brandName: brand.name,
    collectionTitle: coll.title,
    sizeLabel: sizeMatch.label,
    dimensions: sizeMatch.dimensions,
    colors: updated.taxonomy.color ?? "",
    material: updated.taxonomy.material ?? "",
    promo: coll.promo,
  };
  const title = generateTitle(input);
  const pop = computePopularity(updated.brandHandle ?? "", updated.collectionHandle ?? "", sizeMatch.label, updated.taxonomy.color ?? "");
  return {
    ...updated,
    title,
    slug: slugify(title),
    description: generateDescription(input),
    ...(pop != null ? { popularity: String(pop) } : {}),
  };
}

// eslint-disable-next-line complexity -- XAUP-0001 pre-existing, single render function for taxonomy form
function TaxonomyFields({ t, draft, fieldErrors, onChange }: BaseFieldsProps & { t: Translate }) {
  const collDefaults = findCollectionDefaults(draft.brandHandle ?? "", draft.collectionHandle ?? "");

  return (
    <>
      {collDefaults?.department ? (
        <div className="block text-xs uppercase tracking-label text-gate-muted">
          {t("fieldDepartment")}
          <div className={`${INPUT_CLASS} opacity-60`}>
            {draft.taxonomy.department === "women" ? t("departmentWomen") : null}
            {draft.taxonomy.department === "men" ? t("departmentMen") : null}
            {draft.taxonomy.department === "kids" ? t("departmentKids") : null}
          </div>
        </div>
      ) : null}

      <div className="block text-xs uppercase tracking-label text-gate-muted">
        {t("fieldCategory")}
        <div className={`${INPUT_CLASS} opacity-60`}>{t("categoryBags")}</div>
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
          disabled={!!collDefaults?.subcategory}
          className={`${INPUT_CLASS}${collDefaults?.subcategory ? " opacity-60" : ""}`}
        />
        <FieldError message={fieldErrors["taxonomy.subcategory"]} />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("placeholderDimensions")}
        <input
          value={draft.details?.dimensions ?? ""}
          onChange={(event) =>
            onChange({ ...draft, details: { ...draft.details, dimensions: event.target.value } })
          }
          className={INPUT_CLASS}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("bagStrapStyle")}
        <input
          value={draft.taxonomy.strapStyle ?? ""}
          onChange={(event) =>
            onChange({ ...draft, taxonomy: { ...draft.taxonomy, strapStyle: event.target.value } })
          }
          className={INPUT_CLASS}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("placeholderStrapDrop")}
        <input
          value={draft.details?.strapDrop ?? ""}
          onChange={(event) =>
            onChange({ ...draft, details: { ...draft.details, strapDrop: event.target.value } })
          }
          className={INPUT_CLASS}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("bagClosureType")}
        <input
          value={draft.taxonomy.closureType ?? ""}
          onChange={(event) =>
            onChange({ ...draft, taxonomy: { ...draft.taxonomy, closureType: event.target.value } })
          }
          className={INPUT_CLASS}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("bagInterior")}
        <input
          value={draft.details?.interior ?? ""}
          onChange={(event) =>
            onChange({ ...draft, details: { ...draft.details, interior: event.target.value } })
          }
          className={INPUT_CLASS}
        />
      </label>

      <label className="block text-xs uppercase tracking-label text-gate-muted">
        {t("bagDetailsTitle")}
        <input
          value={draft.details?.whatFits ?? ""}
          onChange={(event) =>
            onChange({ ...draft, details: { ...draft.details, whatFits: event.target.value } })
          }
          className={INPUT_CLASS}
        />
      </label>
    </>
  );
}

function StatusSelect({ t, draft, onChange }: { t: Translate; draft: CatalogProductDraftInput; onChange: (next: CatalogProductDraftInput) => void }) {
  return (
    <label className="block text-xs uppercase tracking-label text-gate-muted">
      {t("fieldStatus")}
      <select
        value={draft.publishState ?? "draft"}
        onChange={(event) =>
          onChange({
            ...draft,
            publishState: event.target.value as CatalogProductDraftInput["publishState"],
          })
        }
        className={INPUT_CLASS}
      >
        <option value="draft">{t("statusDraft")}</option>
        <option value="out_of_stock">{t("statusOutOfStock")}</option>
      </select>
      <div className="mt-1 text-2xs text-gate-muted">{t("fieldStatusHint")}</div>
    </label>
  );
}

function CommercialFields({ t, draft, fieldErrors: _fieldErrors, onChange: _onChange }: BaseFieldsProps & { t: Translate }) {
  return (
    <>
      {/* description is auto-derived from brand/collection/size/color data and stored in the draft;
          it is not shown here because the operator cannot meaningfully edit it */}

      {draft.popularity ? (
        <div className="block text-xs uppercase tracking-label text-gate-muted">
          {t("fieldPopularity")}
          <div className={`${INPUT_CLASS} opacity-60`}>{draft.popularity}</div>
        </div>
      ) : null}
    </>
  );
}

export type CatalogBaseFieldSection = "identity" | "taxonomy" | "commercial";

export function CatalogProductBaseFields(props: BaseFieldsProps) {
  const { t } = useUploaderI18n();
  const sections = new Set<CatalogBaseFieldSection>(
    (props.sections ?? ["identity", "taxonomy", "commercial"]) as CatalogBaseFieldSection[],
  );

  return (
    // eslint-disable-next-line ds/container-widths-only-at, ds/enforce-layout-primitives -- XAUP-0001 operator-tool constrained form
    <div className="mx-auto grid max-w-prose gap-4">
      {sections.has("identity") ? (
        <>
          <div className={SECTION_HEADER_CLASS}>
            {t("fieldSectionIdentity")}
          </div>
          <IdentityFields {...props} t={t} />
        </>
      ) : null}
      {sections.has("taxonomy") && props.draft.collectionHandle ? (
        <>
          <div className={SECTION_HEADER_CLASS}>
            {t("fieldSectionTaxonomy")}
          </div>
          <TaxonomyFields {...props} t={t} />
        </>
      ) : null}
      {sections.has("commercial") && props.draft.collectionHandle ? (
        <>
          <div className={SECTION_HEADER_CLASS}>
            {t("fieldSectionCommercial")}
          </div>
          <CommercialFields {...props} t={t} />
        </>
      ) : null}
    </div>
  );
}
