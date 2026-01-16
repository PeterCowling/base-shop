import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import { pick, readCsv, slugify, type CsvRow } from "./xa-utils";

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node --import tsx scripts/src/xa/merge-xa-csvs.ts --products <products.csv> --images <images.csv> --out <products.with-images.csv>",
      "",
      "Output:",
      '  Adds/updates columns: image_files and image_alt_texts (pipe-separated), suitable for --simple mode.',
    ].join("\n"),
  );
}

function csvEscape(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, `""`)}"`;
}

function buildHeader(rows: Array<Record<string, string>>, extra: string[]): string[] {
  const knownOrder = [
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
    "media_paths",
    "media_alt_texts",
  ];

  const present = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((k) => present.add(k)));

  const header: string[] = [];
  for (const key of knownOrder) {
    if (present.has(key)) header.push(key);
  }
  const rest = Array.from(present)
    .filter((k) => !header.includes(k) && !extra.includes(k))
    .sort((a, b) => a.localeCompare(b));
  header.push(...rest);
  header.push(...extra.filter((k) => !header.includes(k)));
  return header;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      products: { type: "string" },
      images: { type: "string" },
      out: { type: "string" },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const productsPath = values.products ? String(values.products) : "";
  const imagesPath = values.images ? String(values.images) : "";
  const outPath = values.out ? String(values.out) : "";
  if (!productsPath || !imagesPath || !outPath) {
    printUsage();
    throw new Error("Missing --products, --images, or --out.");
  }

  const productRows = await readCsv(productsPath);
  const imageRows = await readCsv(imagesPath);

  const imagesByProduct = new Map<
    string,
    Array<{ file: string; altText: string; order: number }>
  >();

  imageRows.forEach((row, idx) => {
    const slug = slugify(pick(row, ["product_slug", "slug", "product"]));
    const file = pick(row, ["file", "file_path", "filepath", "path"]);
    if (!slug || !file) return;
    const altText = pick(row, ["alt_text", "alt", "alttext"]);
    const positionRaw = pick(row, ["position", "order", "index"]);
    const position = positionRaw ? Number(positionRaw) : undefined;
    const list = imagesByProduct.get(slug) ?? [];
    if (!imagesByProduct.has(slug)) {
      imagesByProduct.set(slug, list);
    }
    list.push({
      file,
      altText,
      order: Number.isFinite(position) ? position! : idx,
    });
  });

  for (const [slug, items] of imagesByProduct.entries()) {
    items.sort((a, b) => a.order - b.order);
  }

  const enriched: Array<CsvRow & { image_files: string; image_alt_texts: string }> = productRows.map((row) => {
    const title = pick(row, ["title", "name"]);
    const slug = slugify(pick(row, ["slug", "handle"]) || title);
    const images = slug ? imagesByProduct.get(slug) ?? [] : [];
    const imageFiles = images.map((i) => i.file).join("|");
    const imageAlts = images
      .map((i) => i.altText)
      .map((t) => t || title || slug)
      .join("|");
    return {
      ...row,
      image_files: imageFiles,
      image_alt_texts: imageAlts,
    };
  });

  const header = buildHeader(enriched, ["image_files", "image_alt_texts"]);
  const csv =
    `${header.join(",")}\n` +
    enriched
      .map((row) => header.map((key) => csvEscape(row[key] ?? "")).join(","))
      .join("\n") +
    "\n";

  await writeFile(outPath, csv, "utf8");
  console.log(`Wrote merged CSV to ${outPath}`);
  console.log(`Products: ${enriched.length} | Images rows: ${imageRows.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
