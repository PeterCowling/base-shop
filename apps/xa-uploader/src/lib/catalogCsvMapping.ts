import {
  catalogProductDraftSchema,
  joinList,
  slugify,
  splitList,
  type CatalogProductDraftInput,
} from "./catalogAdminSchema";
import { parseBoolean, type XaProductsCsvRow } from "./catalogCsvFormat";

export function buildCsvRowUpdateFromDraft(input: CatalogProductDraftInput): XaProductsCsvRow {
  const value = catalogProductDraftSchema.parse(input);
  const normalizedSlug = slugify(value.slug?.trim() || value.title);
  const normalizedBrand = slugify(value.brandHandle);
  const normalizedCollection = slugify(
    value.collectionHandle?.trim() || value.collectionTitle?.trim() || "",
  );

  const sizes = joinList(splitList(value.sizes ?? ""));
  const imageFiles = joinList(splitList(value.imageFiles ?? ""));
  const imageAltTexts = joinList(splitList(value.imageAltTexts ?? ""));

  const color = joinList(splitList(value.taxonomy.color ?? ""));
  const material = joinList(splitList(value.taxonomy.material ?? ""));
  const occasion = joinList(splitList(value.taxonomy.occasion ?? ""));
  const fits = joinList(splitList(value.taxonomy.fits ?? ""));

  const details = value.details ?? {};
  const whatFits = joinList(splitList(details.whatFits ?? ""));
  const interior = joinList(splitList(details.interior ?? ""));

  return {
    id: value.id?.trim() || "",
    slug: normalizedSlug,
    title: value.title.trim(),
    brand_handle: normalizedBrand,
    brand_name: (value.brandName ?? "").trim(),
    collection_handle: normalizedCollection,
    collection_title: (value.collectionTitle ?? "").trim(),
    collection_description: (value.collectionDescription ?? "").trim(),
    price: String(value.price),
    compare_at_price: value.compareAtPrice === undefined ? "" : String(value.compareAtPrice),
    deposit: value.deposit === undefined ? "" : String(value.deposit),
    stock: value.stock === undefined ? "" : String(value.stock),
    for_sale: value.forSale === undefined ? "" : String(Boolean(value.forSale)),
    for_rental: value.forRental === undefined ? "" : String(Boolean(value.forRental)),
    sizes,
    description: (value.description ?? "").trim(),
    created_at: (value.createdAt ?? "").trim(),
    popularity: value.popularity === undefined ? "" : String(value.popularity),
    image_files: imageFiles,
    image_alt_texts: imageAltTexts,
    taxonomy_department: value.taxonomy.department,
    taxonomy_category: value.taxonomy.category,
    taxonomy_subcategory: value.taxonomy.subcategory.trim(),
    taxonomy_color: color,
    taxonomy_material: material,
    taxonomy_fit: (value.taxonomy.fit ?? "").trim(),
    taxonomy_length: (value.taxonomy.length ?? "").trim(),
    taxonomy_neckline: (value.taxonomy.neckline ?? "").trim(),
    taxonomy_sleeve_length: (value.taxonomy.sleeveLength ?? "").trim(),
    taxonomy_pattern: (value.taxonomy.pattern ?? "").trim(),
    taxonomy_occasion: occasion,
    taxonomy_size_class: (value.taxonomy.sizeClass ?? "").trim(),
    taxonomy_strap_style: (value.taxonomy.strapStyle ?? "").trim(),
    taxonomy_hardware_color: (value.taxonomy.hardwareColor ?? "").trim(),
    taxonomy_closure_type: (value.taxonomy.closureType ?? "").trim(),
    taxonomy_fits: fits,
    taxonomy_metal: (value.taxonomy.metal ?? "").trim(),
    taxonomy_gemstone: (value.taxonomy.gemstone ?? "").trim(),
    taxonomy_jewelry_size: (value.taxonomy.jewelrySize ?? "").trim(),
    taxonomy_jewelry_style: (value.taxonomy.jewelryStyle ?? "").trim(),
    taxonomy_jewelry_tier: (value.taxonomy.jewelryTier ?? "").trim(),
    details_model_height: (details.modelHeight ?? "").trim(),
    details_model_size: (details.modelSize ?? "").trim(),
    details_fit_note: (details.fitNote ?? "").trim(),
    details_fabric_feel: (details.fabricFeel ?? "").trim(),
    details_care: (details.care ?? "").trim(),
    details_dimensions: (details.dimensions ?? "").trim(),
    details_strap_drop: (details.strapDrop ?? "").trim(),
    details_what_fits: whatFits,
    details_interior: interior,
    details_size_guide: (details.sizeGuide ?? "").trim(),
    details_warranty: (details.warranty ?? "").trim(),
  };
}

export function rowToDraftInput(row: XaProductsCsvRow): CatalogProductDraftInput {
  const department = (row.taxonomy_department || "women") as CatalogProductDraftInput["taxonomy"]["department"];
  const category = (row.taxonomy_category || "clothing") as CatalogProductDraftInput["taxonomy"]["category"];
  return {
    id: row.id || undefined,
    slug: row.slug || undefined,
    title: row.title || "",
    brandHandle: row.brand_handle || "",
    brandName: row.brand_name || undefined,
    collectionHandle: row.collection_handle || undefined,
    collectionTitle: row.collection_title || undefined,
    collectionDescription: row.collection_description || undefined,
    price: row.price || "0",
    compareAtPrice: row.compare_at_price || undefined,
    deposit: row.deposit || undefined,
    stock: row.stock || undefined,
    forSale: parseBoolean(row.for_sale || "", true),
    forRental: parseBoolean(row.for_rental || "", false),
    sizes: row.sizes || undefined,
    description: row.description || undefined,
    createdAt: row.created_at || undefined,
    popularity: row.popularity || undefined,
    imageFiles: row.image_files || undefined,
    imageAltTexts: row.image_alt_texts || undefined,
    taxonomy: {
      department,
      category,
      subcategory: row.taxonomy_subcategory || "",
      color: row.taxonomy_color || "",
      material: row.taxonomy_material || "",
      fit: row.taxonomy_fit || undefined,
      length: row.taxonomy_length || undefined,
      neckline: row.taxonomy_neckline || undefined,
      sleeveLength: row.taxonomy_sleeve_length || undefined,
      pattern: row.taxonomy_pattern || undefined,
      occasion: row.taxonomy_occasion || undefined,
      sizeClass: row.taxonomy_size_class || undefined,
      strapStyle: row.taxonomy_strap_style || undefined,
      hardwareColor: row.taxonomy_hardware_color || undefined,
      closureType: row.taxonomy_closure_type || undefined,
      fits: row.taxonomy_fits || undefined,
      metal: row.taxonomy_metal || undefined,
      gemstone: row.taxonomy_gemstone || undefined,
      jewelrySize: row.taxonomy_jewelry_size || undefined,
      jewelryStyle: row.taxonomy_jewelry_style || undefined,
      jewelryTier: row.taxonomy_jewelry_tier || undefined,
    },
    details: {
      modelHeight: row.details_model_height || undefined,
      modelSize: row.details_model_size || undefined,
      fitNote: row.details_fit_note || undefined,
      fabricFeel: row.details_fabric_feel || undefined,
      care: row.details_care || undefined,
      dimensions: row.details_dimensions || undefined,
      strapDrop: row.details_strap_drop || undefined,
      whatFits: row.details_what_fits || undefined,
      interior: row.details_interior || undefined,
      sizeGuide: row.details_size_guide || undefined,
      warranty: row.details_warranty || undefined,
    },
  };
}
