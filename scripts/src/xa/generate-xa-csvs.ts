import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { slugify, titleCase } from "./xa-utils";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node --import tsx scripts/src/xa/generate-xa-csvs.ts --images-root <dir> [--out-dir <dir>] [--products-out <path>] [--images-out <path>] [--default-brand-handle <handle>] [--default-collection-handle <handle>] [--default-price <n>] [--recursive]",
      "",
      "Example folder structure:",
      "  <images-root>/studio-jacket/01.jpg",
      "  <images-root>/studio-jacket/02.jpg",
    ].join("\n"),
  );
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function csvEscape(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, `""`)}"`;
}

async function listImageFiles(dir: string, recursive: boolean): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) out.push(...(await listImageFiles(fullPath, true)));
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    out.push(fullPath);
  }
  out.sort((a, b) => toPosixPath(a).localeCompare(toPosixPath(b)));
  return out;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "images-root": { type: "string" },
      "out-dir": { type: "string" },
      "products-out": { type: "string" },
      "images-out": { type: "string" },
      "default-brand-handle": { type: "string" },
      "default-collection-handle": { type: "string" },
      "default-price": { type: "string" },
      recursive: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const imagesRoot = values["images-root"] ? String(values["images-root"]) : "";
  if (!imagesRoot) {
    printUsage();
    throw new Error("Missing --images-root.");
  }

  const outDir = values["out-dir"] ? String(values["out-dir"]) : process.cwd();
  const productsOut = values["products-out"]
    ? String(values["products-out"])
    : path.join(outDir, "products.generated.csv");
  const imagesOut = values["images-out"]
    ? String(values["images-out"])
    : path.join(outDir, "images.generated.csv");

  const defaultBrandHandle = values["default-brand-handle"]
    ? slugify(String(values["default-brand-handle"]))
    : "";
  const defaultCollectionHandle = values["default-collection-handle"]
    ? slugify(String(values["default-collection-handle"]))
    : "";
  const defaultPrice = values["default-price"] ? String(values["default-price"]) : "";
  const recursive = Boolean(values.recursive);

  const rootAbs = path.resolve(imagesRoot);
  const entries = await readdir(rootAbs, { withFileTypes: true });
  const productDirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const productRows: Array<Record<string, string>> = [];
  const imageRows: Array<Record<string, string>> = [];

  for (const dirName of productDirs) {
    const slug = slugify(dirName);
    if (!slug) continue;
    const title = titleCase(slug);

    productRows.push({
      id: "",
      slug,
      title,
      brand_handle: defaultBrandHandle,
      brand_name: "",
      collection_handle: defaultCollectionHandle,
      collection_title: "",
      collection_description: "",
      price: defaultPrice,
      compare_at_price: "",
      deposit: "",
      stock: "",
      for_sale: "",
      for_rental: "",
      sizes: "",
      description: "",
      created_at: "",
      popularity: "",
      taxonomy_department: "",
      taxonomy_category: "",
      taxonomy_subcategory: "",
      taxonomy_color: "",
      taxonomy_material: "",
      taxonomy_fit: "",
      taxonomy_length: "",
      taxonomy_neckline: "",
      taxonomy_sleeve_length: "",
      taxonomy_pattern: "",
      taxonomy_occasion: "",
      taxonomy_size_class: "",
      taxonomy_strap_style: "",
      taxonomy_hardware_color: "",
      taxonomy_closure_type: "",
      taxonomy_fits: "",
      taxonomy_metal: "",
      taxonomy_gemstone: "",
      taxonomy_jewelry_size: "",
      taxonomy_jewelry_style: "",
      taxonomy_jewelry_tier: "",
      details_model_height: "",
      details_model_size: "",
      details_fit_note: "",
      details_fabric_feel: "",
      details_care: "",
      details_dimensions: "",
      details_strap_drop: "",
      details_what_fits: "",
      details_interior: "",
      details_size_guide: "",
      details_warranty: "",
      media_paths: "",
      media_alt_texts: "",
    });

    const dirPath = path.join(rootAbs, dirName);
    const files = await listImageFiles(dirPath, recursive);
    files.forEach((filePath, idx) => {
      imageRows.push({
        product_slug: slug,
        file: toPosixPath(path.relative(rootAbs, filePath)),
        alt_text: title,
        position: String(idx + 1),
      });
    });
  }

  const productsHeader = Object.keys(productRows[0] ?? {});
  const imagesHeader = ["product_slug", "file", "alt_text", "position"];

  const productsCsv =
    `${productsHeader.join(",")}\n` +
    productRows
      .map((row) => productsHeader.map((key) => csvEscape(row[key] ?? "")).join(","))
      .join("\n") +
    "\n";

  const imagesCsv =
    `${imagesHeader.join(",")}\n` +
    imageRows
      .map((row) => imagesHeader.map((key) => csvEscape(row[key] ?? "")).join(","))
      .join("\n") +
    "\n";

  await writeFile(productsOut, productsCsv, "utf8");
  await writeFile(imagesOut, imagesCsv, "utf8");

  console.log(`Wrote ${productRows.length} product rows to ${productsOut}`);
  console.log(`Wrote ${imageRows.length} image rows to ${imagesOut}`);
  console.log(`Images base dir: ${rootAbs}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
