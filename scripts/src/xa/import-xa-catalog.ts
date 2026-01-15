import path from "node:path";
import { parseArgs } from "node:util";

import { runXaCatalogImport } from "./xa-import-catalog";

const DEFAULT_OUT = path.join("apps", "xa", "src", "data", "catalog.json");

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node --import tsx scripts/src/xa/import-xa-catalog.ts --products <products.csv> [--images <images.csv|images.json>] [--out <catalog.json>] [--merge] [--base-catalog <catalog.json>] [--backup] [--backup-dir <dir>] [--dry-run] [--strict]",
      "",
      "Required CSV columns (products):",
      "  title, brand_handle (or brand), collection_handle (or collection), price,",
      "  taxonomy_department, taxonomy_category, taxonomy_subcategory, taxonomy_color, taxonomy_material",
      "",
      "Optional CSV columns (products):",
      "  id, slug, brand_name, collection_title, collection_description, compare_at_price,",
      "  deposit, stock, for_sale, for_rental, sizes, description, created_at, popularity,",
      "  image_files, image_alt_texts, media_paths, media_alt_texts,",
      "  taxonomy_fit, taxonomy_length, taxonomy_neckline, taxonomy_sleeve_length, taxonomy_pattern, taxonomy_occasion,",
      "  taxonomy_size_class, taxonomy_strap_style, taxonomy_hardware_color, taxonomy_closure_type, taxonomy_fits,",
      "  taxonomy_metal, taxonomy_gemstone, taxonomy_jewelry_size, taxonomy_jewelry_style, taxonomy_jewelry_tier,",
      "  details_model_height, details_model_size, details_fit_note, details_fabric_feel, details_care,",
      "  details_dimensions, details_strap_drop, details_what_fits, details_interior, details_size_guide, details_warranty",
      "",
      "Images mapping (CSV) columns:",
      "  product_slug, path, alt_text, position",
      "",
      "Images mapping (JSON) shape:",
      '  { "mediaByProduct": { "<slug>": [{ "type": "image", "path": "id", "altText": "..." }] } }',
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      products: { type: "string" },
      images: { type: "string" },
      out: { type: "string" },
      merge: { type: "boolean", default: false },
      "base-catalog": { type: "string" },
      backup: { type: "boolean", default: false },
      "backup-dir": { type: "string" },
      "dry-run": { type: "boolean", default: false },
      strict: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const productsPath = values.products;
  if (!productsPath) {
    printUsage();
    throw new Error("Missing --products CSV path.");
  }

  const strict = Boolean(values.strict);
  const merge = Boolean(values.merge);
  const dryRun = Boolean(values["dry-run"]);
  const imagesPath = values.images;
  const outPath = values.out ? String(values.out) : DEFAULT_OUT;
  const baseCatalogPath = values["base-catalog"] ? String(values["base-catalog"]) : undefined;
  const backup = Boolean(values.backup);
  const backupDir = values["backup-dir"] ? String(values["backup-dir"]) : undefined;

  const { catalog, warnings } = await runXaCatalogImport({
    productsPath: String(productsPath),
    imagesPath: imagesPath ? String(imagesPath) : undefined,
    outPath,
    merge,
    baseCatalogPath,
    backup,
    backupDir,
    dryRun,
    strict,
  });

  if (dryRun) {
    console.log(
      `Dry-run: would write ${catalog.products.length} products, ${catalog.brands.length} brands, ${catalog.collections.length} collections to ${outPath}`,
    );
  } else {
    console.log(
      `Wrote ${catalog.products.length} products, ${catalog.brands.length} brands, ${catalog.collections.length} collections to ${outPath}`,
    );
  }

  for (const warning of warnings) console.warn(warning);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

