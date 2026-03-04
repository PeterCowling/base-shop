/**
 * Seed script: reads catalog.runtime.json and writes products-xa-b.csv
 * for the xa-uploader sync pipeline.
 *
 * Usage: npx tsx scripts/src/xa/seed-xa-csv.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Inlined from apps/xa-uploader/src/lib/catalogCsvColumns.ts to avoid cross-rootDir import.
const XA_PRODUCTS_CSV_COLUMN_ORDER = [
  "id", "slug", "title", "brand_handle", "brand_name", "collection_handle",
  "collection_title", "collection_description", "price", "compare_at_price",
  "deposit", "stock", "for_sale", "for_rental", "publish_state", "sizes",
  "description", "created_at", "popularity", "image_files", "image_alt_texts",
  "media_paths", "media_alt_texts", "taxonomy_department", "taxonomy_category",
  "taxonomy_subcategory", "taxonomy_color", "taxonomy_material", "taxonomy_fit",
  "taxonomy_length", "taxonomy_neckline", "taxonomy_sleeve_length", "taxonomy_pattern",
  "taxonomy_occasion", "taxonomy_size_class", "taxonomy_strap_style",
  "taxonomy_hardware_color", "taxonomy_interior_color", "taxonomy_closure_type",
  "taxonomy_fits", "taxonomy_metal", "taxonomy_gemstone", "taxonomy_jewelry_size",
  "taxonomy_jewelry_style", "taxonomy_jewelry_tier", "details_model_height",
  "details_model_size", "details_fit_note", "details_fabric_feel", "details_care",
  "details_dimensions", "details_strap_drop", "details_what_fits", "details_interior",
  "details_size_guide", "details_warranty",
] as const;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const CATALOG_PATH = path.join(REPO_ROOT, "apps/xa-b/src/data/catalog.runtime.json");
const OUTPUT_PATH = path.join(REPO_ROOT, "apps/xa-uploader/data/products-xa-b.csv");

interface CatalogMedia {
  type: string;
  path: string;
  altText: string;
}

interface CatalogProduct {
  id: string;
  slug: string;
  title: string;
  brand: string;
  collection: string;
  price: number;
  prices?: Record<string, number>;
  compareAtPrice?: number;
  deposit?: number;
  stock: number;
  forSale: boolean;
  forRental: boolean;
  media: CatalogMedia[];
  sizes: string[];
  description: string;
  createdAt: string;
  popularity: number;
  taxonomy: Record<string, unknown>;
  details?: Record<string, unknown>;
}

interface CatalogPayload {
  collections: Array<{ handle: string; title: string; description: string }>;
  brands: Array<{ handle: string; name: string }>;
  products: CatalogProduct[];
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function joinPipe(values: unknown[] | undefined): string {
  if (!values || values.length === 0) return "";
  return values.map(String).join("|");
}

function productToRow(
  product: CatalogProduct,
  collections: CatalogPayload["collections"],
  brands: CatalogPayload["brands"],
): Record<string, string> {
  const collection = collections.find((c) => c.handle === product.collection);
  const brand = brands.find((b) => b.handle === product.brand);
  const tax = product.taxonomy;
  const det = product.details ?? {};

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    brand_handle: product.brand,
    brand_name: brand?.name ?? "",
    collection_handle: product.collection,
    collection_title: collection?.title ?? "",
    collection_description: collection?.description ?? "",
    price: String(product.price),
    compare_at_price: String(product.compareAtPrice ?? ""),
    deposit: String(product.deposit ?? 0),
    stock: String(product.stock),
    for_sale: String(product.forSale),
    for_rental: String(product.forRental),
    publish_state: "ready",
    sizes: joinPipe(product.sizes),
    description: product.description,
    created_at: product.createdAt,
    popularity: String(product.popularity),
    image_files: product.media
      .filter((m) => m.type === "image")
      .map((m) => m.path)
      .join("|"),
    image_alt_texts: product.media
      .filter((m) => m.type === "image")
      .map((m) => m.altText)
      .join("|"),
    media_paths: "",
    media_alt_texts: "",
    taxonomy_department: String(tax.department ?? ""),
    taxonomy_category: String(tax.category ?? ""),
    taxonomy_subcategory: String(tax.subcategory ?? ""),
    taxonomy_color: joinPipe(tax.color as string[]),
    taxonomy_material: joinPipe(tax.material as string[]),
    taxonomy_fit: String(tax.fit ?? ""),
    taxonomy_length: String(tax.length ?? ""),
    taxonomy_neckline: String(tax.neckline ?? ""),
    taxonomy_sleeve_length: String(tax.sleevelength ?? ""),
    taxonomy_pattern: String(tax.pattern ?? ""),
    taxonomy_occasion: String(tax.occasion ?? ""),
    taxonomy_size_class: String(tax.sizeClass ?? ""),
    taxonomy_strap_style: String(tax.strapStyle ?? ""),
    taxonomy_hardware_color: String(tax.hardwareColor ?? ""),
    taxonomy_interior_color: String(tax.interiorColor ?? ""),
    taxonomy_closure_type: String(tax.closureType ?? ""),
    taxonomy_fits: joinPipe(tax.fits as string[]),
    taxonomy_metal: String(tax.metal ?? ""),
    taxonomy_gemstone: String(tax.gemstone ?? ""),
    taxonomy_jewelry_size: String(tax.jewelrySize ?? ""),
    taxonomy_jewelry_style: String(tax.jewelryStyle ?? ""),
    taxonomy_jewelry_tier: String(tax.jewelryTier ?? ""),
    details_model_height: String(det.modelHeight ?? ""),
    details_model_size: String(det.modelSize ?? ""),
    details_fit_note: String(det.fitNote ?? ""),
    details_fabric_feel: String(det.fabricFeel ?? ""),
    details_care: String(det.care ?? ""),
    details_dimensions: String(det.dimensions ?? ""),
    details_strap_drop: String(det.strapDrop ?? ""),
    details_what_fits: joinPipe(det.whatFits as string[]),
    details_interior: joinPipe(det.interior as string[]),
    details_size_guide: String(det.sizeGuide ?? ""),
    details_warranty: String(det.warranty ?? ""),
  };
}

function main() {
  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  const catalog: CatalogPayload = JSON.parse(raw);

  const header = XA_PRODUCTS_CSV_COLUMN_ORDER.join(",");
  const rows = catalog.products.map((product) => {
    const row = productToRow(product, catalog.collections, catalog.brands);
    return XA_PRODUCTS_CSV_COLUMN_ORDER.map((col) => escapeCsvField(row[col] ?? "")).join(",");
  });

  const csv = [header, ...rows].join("\n") + "\n";

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_PATH, csv, "utf8");

  console.log(`Wrote ${catalog.products.length} products to ${OUTPUT_PATH}`);
}

main();
