import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  joinList,
  slugify,
  splitList,
} from "./catalogAdminSchema";
import { parseBoolean, type XaProductsCsvRow } from "./catalogCsvFormat";

function trimOrEmpty(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function trimOrUndefined(value: unknown): string | undefined {
  const trimmed = trimOrEmpty(value);
  return trimmed.length > 0 ? trimmed : undefined;
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const trimmed = trimOrEmpty(value);
    if (trimmed.length > 0) return trimmed;
  }
  return "";
}

function toOptionalNumberString(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim().length > 0) return String(value);
  return "";
}

function toOptionalBooleanString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(Boolean(value));
}

function normalizeListValue(value: unknown): string {
  return joinList(splitList(trimOrEmpty(value)));
}

function defaultDepartment(value: unknown): CatalogProductDraftInput["taxonomy"]["department"] {
  const department = trimOrEmpty(value);
  return (department.length > 0 ? department : "women") as CatalogProductDraftInput["taxonomy"]["department"];
}

function defaultCategory(value: unknown): CatalogProductDraftInput["taxonomy"]["category"] {
  const category = trimOrEmpty(value);
  return (category.length > 0 ? category : "clothing") as CatalogProductDraftInput["taxonomy"]["category"];
}

export function buildCsvRowUpdateFromDraft(input: CatalogProductDraftInput): XaProductsCsvRow {
  const value = catalogProductDraftSchema.parse(input);
  const normalizedSlug = slugify(firstNonEmpty(value.slug, value.title));
  const normalizedBrand = slugify(trimOrEmpty(value.brandHandle));
  const normalizedCollection = slugify(firstNonEmpty(value.collectionHandle, value.collectionTitle));

  const sizes = normalizeListValue(value.sizes);
  const imageFiles = normalizeListValue(value.imageFiles);
  const imageAltTexts = normalizeListValue(value.imageAltTexts);

  const color = normalizeListValue(value.taxonomy.color);
  const material = normalizeListValue(value.taxonomy.material);
  const occasion = normalizeListValue(value.taxonomy.occasion);
  const fits = normalizeListValue(value.taxonomy.fits);

  const details = value.details ?? {};
  const whatFits = normalizeListValue(details.whatFits);
  const interior = normalizeListValue(details.interior);

  return {
    id: trimOrEmpty(value.id),
    slug: normalizedSlug,
    title: trimOrEmpty(value.title),
    brand_handle: normalizedBrand,
    brand_name: trimOrEmpty(value.brandName),
    collection_handle: normalizedCollection,
    collection_title: trimOrEmpty(value.collectionTitle),
    collection_description: trimOrEmpty(value.collectionDescription),
    price: toOptionalNumberString(value.price),
    compare_at_price: toOptionalNumberString(value.compareAtPrice),
    deposit: toOptionalNumberString(value.deposit),
    stock: toOptionalNumberString(value.stock),
    for_sale: toOptionalBooleanString(value.forSale),
    for_rental: toOptionalBooleanString(value.forRental),
    sizes,
    description: trimOrEmpty(value.description),
    created_at: trimOrEmpty(value.createdAt),
    popularity: toOptionalNumberString(value.popularity),
    image_files: imageFiles,
    image_alt_texts: imageAltTexts,
    taxonomy_department: value.taxonomy.department,
    taxonomy_category: value.taxonomy.category,
    taxonomy_subcategory: trimOrEmpty(value.taxonomy.subcategory),
    taxonomy_color: color,
    taxonomy_material: material,
    taxonomy_fit: trimOrEmpty(value.taxonomy.fit),
    taxonomy_length: trimOrEmpty(value.taxonomy.length),
    taxonomy_neckline: trimOrEmpty(value.taxonomy.neckline),
    taxonomy_sleeve_length: trimOrEmpty(value.taxonomy.sleeveLength),
    taxonomy_pattern: trimOrEmpty(value.taxonomy.pattern),
    taxonomy_occasion: occasion,
    taxonomy_size_class: trimOrEmpty(value.taxonomy.sizeClass),
    taxonomy_strap_style: trimOrEmpty(value.taxonomy.strapStyle),
    taxonomy_hardware_color: trimOrEmpty(value.taxonomy.hardwareColor),
    taxonomy_closure_type: trimOrEmpty(value.taxonomy.closureType),
    taxonomy_fits: fits,
    taxonomy_metal: trimOrEmpty(value.taxonomy.metal),
    taxonomy_gemstone: trimOrEmpty(value.taxonomy.gemstone),
    taxonomy_jewelry_size: trimOrEmpty(value.taxonomy.jewelrySize),
    taxonomy_jewelry_style: trimOrEmpty(value.taxonomy.jewelryStyle),
    taxonomy_jewelry_tier: trimOrEmpty(value.taxonomy.jewelryTier),
    details_model_height: trimOrEmpty(details.modelHeight),
    details_model_size: trimOrEmpty(details.modelSize),
    details_fit_note: trimOrEmpty(details.fitNote),
    details_fabric_feel: trimOrEmpty(details.fabricFeel),
    details_care: trimOrEmpty(details.care),
    details_dimensions: trimOrEmpty(details.dimensions),
    details_strap_drop: trimOrEmpty(details.strapDrop),
    details_what_fits: whatFits,
    details_interior: interior,
    details_size_guide: trimOrEmpty(details.sizeGuide),
    details_warranty: trimOrEmpty(details.warranty),
  };
}

export function rowToDraftInput(row: XaProductsCsvRow): CatalogProductDraftInput {
  const department = defaultDepartment(row.taxonomy_department);
  const category = defaultCategory(row.taxonomy_category);
  return {
    id: trimOrUndefined(row.id),
    slug: trimOrUndefined(row.slug),
    title: trimOrEmpty(row.title),
    brandHandle: trimOrEmpty(row.brand_handle),
    brandName: trimOrUndefined(row.brand_name),
    collectionHandle: trimOrUndefined(row.collection_handle),
    collectionTitle: trimOrUndefined(row.collection_title),
    collectionDescription: trimOrUndefined(row.collection_description),
    price: firstNonEmpty(row.price, "0"),
    compareAtPrice: trimOrUndefined(row.compare_at_price),
    deposit: trimOrUndefined(row.deposit),
    stock: trimOrUndefined(row.stock),
    forSale: parseBoolean(trimOrEmpty(row.for_sale), true),
    forRental: parseBoolean(trimOrEmpty(row.for_rental), false),
    sizes: trimOrUndefined(row.sizes),
    description: trimOrUndefined(row.description),
    createdAt: trimOrUndefined(row.created_at),
    popularity: trimOrUndefined(row.popularity),
    imageFiles: trimOrUndefined(row.image_files),
    imageAltTexts: trimOrUndefined(row.image_alt_texts),
    taxonomy: {
      department,
      category,
      subcategory: trimOrEmpty(row.taxonomy_subcategory),
      color: trimOrEmpty(row.taxonomy_color),
      material: trimOrEmpty(row.taxonomy_material),
      fit: trimOrUndefined(row.taxonomy_fit),
      length: trimOrUndefined(row.taxonomy_length),
      neckline: trimOrUndefined(row.taxonomy_neckline),
      sleeveLength: trimOrUndefined(row.taxonomy_sleeve_length),
      pattern: trimOrUndefined(row.taxonomy_pattern),
      occasion: trimOrUndefined(row.taxonomy_occasion),
      sizeClass: trimOrUndefined(row.taxonomy_size_class),
      strapStyle: trimOrUndefined(row.taxonomy_strap_style),
      hardwareColor: trimOrUndefined(row.taxonomy_hardware_color),
      closureType: trimOrUndefined(row.taxonomy_closure_type),
      fits: trimOrUndefined(row.taxonomy_fits),
      metal: trimOrUndefined(row.taxonomy_metal),
      gemstone: trimOrUndefined(row.taxonomy_gemstone),
      jewelrySize: trimOrUndefined(row.taxonomy_jewelry_size),
      jewelryStyle: trimOrUndefined(row.taxonomy_jewelry_style),
      jewelryTier: trimOrUndefined(row.taxonomy_jewelry_tier),
    },
    details: {
      modelHeight: trimOrUndefined(row.details_model_height),
      modelSize: trimOrUndefined(row.details_model_size),
      fitNote: trimOrUndefined(row.details_fit_note),
      fabricFeel: trimOrUndefined(row.details_fabric_feel),
      care: trimOrUndefined(row.details_care),
      dimensions: trimOrUndefined(row.details_dimensions),
      strapDrop: trimOrUndefined(row.details_strap_drop),
      whatFits: trimOrUndefined(row.details_what_fits),
      interior: trimOrUndefined(row.details_interior),
      sizeGuide: trimOrUndefined(row.details_size_guide),
      warranty: trimOrUndefined(row.details_warranty),
    },
  };
}
