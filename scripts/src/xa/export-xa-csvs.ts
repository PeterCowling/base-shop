import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import type { Catalog, CatalogBrand, CatalogCollection } from "./xa-catalog-types";

const DEFAULT_CATALOG = path.join("apps", "xa", "src", "data", "catalog.json");

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node --import tsx scripts/src/xa/export-xa-csvs.ts [--catalog <catalog.json>] --products-out <products.csv> [--media-out <media.csv>] [--no-media]",
      "",
      "Outputs:",
      "  - products.csv compatible with xa:import-catalog",
      "  - optional media map CSV (product_slug,path,alt_text,position)",
    ].join("\n"),
  );
}

function csvEscape(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, `""`)}"`;
}

function joinList(items: Array<string | undefined>): string {
  return items
    .map((item) => (item ?? "").trim())
    .filter(Boolean)
    .join("|");
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      catalog: { type: "string" },
      "products-out": { type: "string" },
      "media-out": { type: "string" },
      "no-media": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const catalogPath = values.catalog ? String(values.catalog) : DEFAULT_CATALOG;
  const productsOut = values["products-out"] ? String(values["products-out"]) : "";
  if (!productsOut) {
    printUsage();
    throw new Error("Missing --products-out.");
  }
  const mediaOut = values["media-out"] ? String(values["media-out"]) : undefined;
  const includeMedia = !Boolean(values["no-media"]);

  const raw = await readFile(catalogPath, "utf8");
  const catalog = JSON.parse(raw) as Catalog;

  const brandMap = new Map<string, CatalogBrand>();
  for (const brand of catalog.brands ?? []) brandMap.set(brand.handle, brand);
  const collectionMap = new Map<string, CatalogCollection>();
  for (const collection of catalog.collections ?? []) collectionMap.set(collection.handle, collection);

  const header = [
    "id",
    "slug",
    "title",
    "brand_handle",
    "brand_name",
    "collection_handle",
    "collection_title",
    "collection_description",
    "price",
    "compare_at_price",
    "deposit",
    "stock",
    "for_sale",
    "for_rental",
    "sizes",
    "description",
    "created_at",
    "popularity",
    "taxonomy_department",
    "taxonomy_category",
    "taxonomy_subcategory",
    "taxonomy_color",
    "taxonomy_material",
    "taxonomy_fit",
    "taxonomy_length",
    "taxonomy_neckline",
    "taxonomy_sleeve_length",
    "taxonomy_pattern",
    "taxonomy_occasion",
    "taxonomy_size_class",
    "taxonomy_strap_style",
    "taxonomy_hardware_color",
    "taxonomy_closure_type",
    "taxonomy_fits",
    "taxonomy_metal",
    "taxonomy_gemstone",
    "taxonomy_jewelry_size",
    "taxonomy_jewelry_style",
    "taxonomy_jewelry_tier",
    "details_model_height",
    "details_model_size",
    "details_fit_note",
    "details_fabric_feel",
    "details_care",
    "details_dimensions",
    "details_strap_drop",
    "details_what_fits",
    "details_interior",
    "details_size_guide",
    "details_warranty",
    ...(includeMedia ? ["media_paths", "media_alt_texts"] : []),
  ];

  const rows = (catalog.products ?? []).map((product) => {
    const brand = brandMap.get(product.brand);
    const collection = collectionMap.get(product.collection);
    const mediaPaths = includeMedia ? joinList(product.media?.map((m) => m.path) ?? []) : "";
    const mediaAlts = includeMedia ? joinList(product.media?.map((m) => m.altText) ?? []) : "";
    const taxonomy = product.taxonomy;
    const details = product.details;
    const valuesByKey: Record<string, string> = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      brand_handle: product.brand,
      brand_name: brand?.name ?? "",
      collection_handle: product.collection,
      collection_title: collection?.title ?? "",
      collection_description: collection?.description ?? "",
      price: String(product.price),
      compare_at_price: product.compareAtPrice !== undefined ? String(product.compareAtPrice) : "",
      deposit: String(product.deposit ?? 0),
      stock: String(product.stock ?? 0),
      for_sale: String(Boolean(product.forSale)),
      for_rental: String(Boolean(product.forRental)),
      sizes: joinList(product.sizes ?? []),
      description: product.description ?? "",
      created_at: product.createdAt ?? "",
      popularity: String(product.popularity ?? 0),
      taxonomy_department: taxonomy?.department ?? "",
      taxonomy_category: taxonomy?.category ?? "",
      taxonomy_subcategory: taxonomy?.subcategory ?? "",
      taxonomy_color: joinList(taxonomy?.color ?? []),
      taxonomy_material: joinList(taxonomy?.material ?? []),
      taxonomy_fit: taxonomy?.fit ?? "",
      taxonomy_length: taxonomy?.length ?? "",
      taxonomy_neckline: taxonomy?.neckline ?? "",
      taxonomy_sleeve_length: taxonomy?.sleeveLength ?? "",
      taxonomy_pattern: taxonomy?.pattern ?? "",
      taxonomy_occasion: joinList(taxonomy?.occasion ?? []),
      taxonomy_size_class: taxonomy?.sizeClass ?? "",
      taxonomy_strap_style: taxonomy?.strapStyle ?? "",
      taxonomy_hardware_color: taxonomy?.hardwareColor ?? "",
      taxonomy_closure_type: taxonomy?.closureType ?? "",
      taxonomy_fits: joinList(taxonomy?.fits ?? []),
      taxonomy_metal: taxonomy?.metal ?? "",
      taxonomy_gemstone: taxonomy?.gemstone ?? "",
      taxonomy_jewelry_size: taxonomy?.jewelrySize ?? "",
      taxonomy_jewelry_style: taxonomy?.jewelryStyle ?? "",
      taxonomy_jewelry_tier: taxonomy?.jewelryTier ?? "",
      details_model_height: details?.modelHeight ?? "",
      details_model_size: details?.modelSize ?? "",
      details_fit_note: details?.fitNote ?? "",
      details_fabric_feel: details?.fabricFeel ?? "",
      details_care: details?.care ?? "",
      details_dimensions: details?.dimensions ?? "",
      details_strap_drop: details?.strapDrop ?? "",
      details_what_fits: joinList(details?.whatFits ?? []),
      details_interior: joinList(details?.interior ?? []),
      details_size_guide: details?.sizeGuide ?? "",
      details_warranty: details?.warranty ?? "",
      ...(includeMedia ? { media_paths: mediaPaths, media_alt_texts: mediaAlts } : {}),
    };
    return header.map((key) => csvEscape(valuesByKey[key] ?? "")).join(",");
  });

  const productsCsv = `${header.join(",")}\n${rows.join("\n")}\n`;
  await writeFile(productsOut, productsCsv, "utf8");
  console.log(`Wrote ${catalog.products?.length ?? 0} product rows to ${productsOut}`);

  if (mediaOut) {
    const mediaHeader = ["product_slug", "path", "alt_text", "position"];
    const mediaRows: string[] = [];
    for (const product of catalog.products ?? []) {
      (product.media ?? []).forEach((item, idx) => {
        mediaRows.push(
          [
            product.slug,
            item.path,
            item.altText ?? "",
            String(idx + 1),
          ]
            .map(csvEscape)
            .join(","),
        );
      });
    }
    const mediaCsv = `${mediaHeader.join(",")}\n${mediaRows.join("\n")}\n`;
    await writeFile(mediaOut, mediaCsv, "utf8");
    console.log(`Wrote ${mediaRows.length} media rows to ${mediaOut}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
