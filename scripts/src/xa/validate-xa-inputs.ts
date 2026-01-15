import { stat } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { expandFileSpec } from "./xa-file-glob";
import { readImageDimensions } from "./xa-image-dimensions";
import {
  getRowNumber,
  parseList,
  parseNumber,
  pick,
  readCsv,
  slugify,
} from "./xa-utils";

type Issue = { level: "error" | "warn"; message: string };

const DEPARTMENTS = new Set(["women", "men"]);
const CATEGORIES = new Set(["clothing", "bags", "jewelry"]);

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node --import tsx scripts/src/xa/validate-xa-inputs.ts --products <products.csv> [--images <images.csv>] [--base-dir <dir>] [--recursive] [--strict] [--min-image-edge <px>]",
      "",
      "Checks:",
      "  - required product fields and basic types",
      "  - brand/collection precedence conflicts",
      "  - images.csv slugs exist in products.csv",
      "  - image files exist (supports globs/directories like the uploader)",
      "  - image dimensions meet minimum pixel requirements",
    ].join("\n"),
  );
}

function addIssue(issues: Issue[], level: Issue["level"], message: string) {
  issues.push({ level, message });
}

function maybeSuggestSlug(slug: string, candidates: string[]): string | null {
  if (!candidates.length) return null;
  const lower = slug.toLowerCase();
  const startsWith = candidates.filter((c) => c.startsWith(lower.slice(0, Math.min(4, lower.length))));
  if (startsWith.length) return startsWith.slice(0, 3).join(", ");
  return candidates.slice(0, 3).join(", ");
}

async function assertNonEmptyFile(filePath: string): Promise<void> {
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error(`Not a file: ${filePath}`);
  if (info.size === 0) throw new Error(`Empty file: ${filePath}`);
}

async function assertMinImageEdge(filePath: string, minEdge: number): Promise<void> {
  let dims: Awaited<ReturnType<typeof readImageDimensions>>;
  try {
    dims = await readImageDimensions(filePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unsupported image format.";
    throw new Error(`[IMAGE_UNSUPPORTED] ${message}`);
  }

  const shortest = Math.min(dims.width, dims.height);
  if (shortest < minEdge) {
    throw new Error(
      `[IMAGE_TOO_SMALL] Image is too small (${dims.width}x${dims.height}). Minimum is ${minEdge}px on the shortest edge.`,
    );
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      products: { type: "string" },
      images: { type: "string" },
      "base-dir": { type: "string" },
      recursive: { type: "boolean", default: false },
      strict: { type: "boolean", default: false },
      "min-image-edge": { type: "string" },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const productsPath = values.products ? String(values.products) : "";
  if (!productsPath) {
    printUsage();
    throw new Error("Missing --products CSV path.");
  }

  const imagesPath = values.images ? String(values.images) : undefined;
  const strict = Boolean(values.strict);
  const recursiveDirs = Boolean(values.recursive);
  const minImageEdge = Math.max(1, Number(values["min-image-edge"] ?? 1600) || 1600);

  const issues: Issue[] = [];

  const productRows = await readCsv(productsPath);
  const productsBaseDir = values["base-dir"]
    ? String(values["base-dir"])
    : path.dirname(path.resolve(productsPath));

  const productSlugs = new Set<string>();
  const productSlugList: string[] = [];
  let imagesRowCount: number | null = null;

  for (const row of productRows) {
    const rowNumber = getRowNumber(row);
    const rowLabel = rowNumber ? `Row ${rowNumber}` : "Row ?";

    const title = pick(row, ["title", "name"]);
    if (!title) {
      addIssue(issues, "error", `${rowLabel}: Missing required field "title".`);
      continue;
    }

    const slug = slugify(pick(row, ["slug", "handle"]) || title);
    if (!slug) {
      addIssue(issues, "error", `${rowLabel}: Missing required field "slug".`);
    } else if (productSlugs.has(slug)) {
      addIssue(issues, "error", `${rowLabel}: Duplicate product slug "${slug}".`);
    } else {
      productSlugs.add(slug);
      productSlugList.push(slug);
    }

    if (strict && !pick(row, ["id", "product_id"])) {
      addIssue(issues, "error", `${rowLabel}: Missing required field "id" (strict).`);
    }

    const brandHandleCell = pick(row, ["brand_handle"]);
    const brandCell = pick(row, ["brand"]);
    if (!brandHandleCell && !brandCell) {
      addIssue(issues, "error", `${rowLabel}: Missing required brand (brand_handle or brand).`);
    } else if (brandHandleCell && brandCell) {
      const fromHandle = slugify(brandHandleCell);
      const fromBrand = slugify(brandCell);
      if (fromHandle && fromBrand && fromHandle !== fromBrand) {
        const message = `${rowLabel}: brand_handle="${brandHandleCell}" conflicts with brand="${brandCell}" (brand_handle takes precedence).`;
        addIssue(issues, strict ? "error" : "warn", message);
      }
    }

    const collectionHandleCell = pick(row, ["collection_handle"]);
    const collectionCell = pick(row, ["collection"]);
    if (!collectionHandleCell && !collectionCell) {
      addIssue(
        issues,
        "error",
        `${rowLabel}: Missing required collection (collection_handle or collection).`,
      );
    } else if (collectionHandleCell && collectionCell) {
      const fromHandle = slugify(collectionHandleCell);
      const fromLabel = slugify(collectionCell);
      if (fromHandle && fromLabel && fromHandle !== fromLabel) {
        const message = `${rowLabel}: collection_handle="${collectionHandleCell}" conflicts with collection="${collectionCell}" (collection_handle takes precedence).`;
        addIssue(issues, strict ? "error" : "warn", message);
      }
    }

    try {
      parseNumber(pick(row, ["price"]), "price");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      addIssue(issues, "error", `${rowLabel}: ${message}`);
    }

    const department = pick(row, ["taxonomy_department", "department"]).toLowerCase();
    if (!department) {
      addIssue(issues, "error", `${rowLabel}: Missing required field "taxonomy_department".`);
    } else if (!DEPARTMENTS.has(department)) {
      addIssue(
        issues,
        "error",
        `${rowLabel}: Invalid taxonomy_department "${department}" (expected women|men).`,
      );
    }

    const category = pick(row, ["taxonomy_category", "category"]).toLowerCase();
    if (!category) {
      addIssue(issues, "error", `${rowLabel}: Missing required field "taxonomy_category".`);
    } else if (!CATEGORIES.has(category)) {
      addIssue(
        issues,
        "error",
        `${rowLabel}: Invalid taxonomy_category "${category}" (expected clothing|bags|jewelry).`,
      );
    }

    const subcategoryRaw = pick(row, ["taxonomy_subcategory", "subcategory", "type"]);
    const subcategory = slugify(subcategoryRaw);
    if (!subcategory) {
      addIssue(issues, "error", `${rowLabel}: Missing required field "taxonomy_subcategory".`);
    }

    const colors = parseList(pick(row, ["taxonomy_color", "color", "colors"]));
    if (!colors.length) {
      addIssue(issues, "error", `${rowLabel}: Missing required field "taxonomy_color".`);
    }

    const materials = parseList(pick(row, ["taxonomy_material", "material", "materials"]));
    if (!materials.length) {
      addIssue(issues, "error", `${rowLabel}: Missing required field "taxonomy_material".`);
    }

    if (strict && category === "clothing") {
      const sizes = parseList(pick(row, ["sizes", "size"]));
      if (!sizes.length) {
        addIssue(issues, "error", `${rowLabel}: Missing required field "sizes" for clothing.`);
      }
    }

    if (strict && category === "jewelry") {
      const metal = pick(row, ["taxonomy_metal", "metal"]);
      if (!metal) {
        addIssue(issues, "error", `${rowLabel}: Missing required field "taxonomy_metal" for jewelry.`);
      }
    }

    if (strict) {
      const required = [
        "deposit",
        "stock",
        "for_sale",
        "for_rental",
        "description",
        "created_at",
        "popularity",
      ];
      for (const key of required) {
        if (!pick(row, [key])) {
          addIssue(issues, "error", `${rowLabel}: Missing required field "${key}" (strict).`);
        }
      }
    }

    const createdAtRaw = pick(row, ["created_at", "createdat"]);
    if (createdAtRaw) {
      const parsed = Date.parse(createdAtRaw);
      if (Number.isNaN(parsed)) {
        addIssue(issues, "error", `${rowLabel}: Invalid created_at "${createdAtRaw}".`);
      }
    }

    const imageFiles = parseList(pick(row, ["image_files", "image_file_paths", "image_files_local"]));
    const imageAltTexts = parseList(pick(row, ["image_alt_texts", "image_alts"]));
    if (imageFiles.length && imageAltTexts.length && imageAltTexts.length !== imageFiles.length) {
      addIssue(
        issues,
        strict ? "error" : "warn",
        `${rowLabel}: image_alt_texts count (${imageAltTexts.length}) does not match image_files count (${imageFiles.length}).`,
      );
    }

    for (const fileSpec of imageFiles) {
      try {
        const resolved = await expandFileSpec(fileSpec, productsBaseDir, { recursiveDirs });
        for (const filePath of resolved) {
          await assertNonEmptyFile(filePath);
          await assertMinImageEdge(filePath, minImageEdge);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const soft = message.startsWith("[IMAGE_TOO_SMALL]");
        const cleaned = message.replace(/^\[(IMAGE_TOO_SMALL|IMAGE_UNSUPPORTED)\]\s*/, "");
        addIssue(issues, strict || !soft ? "error" : "warn", `${rowLabel}: ${cleaned}`);
      }
    }
  }

  if (imagesPath) {
    const imagesBaseDir = values["base-dir"]
      ? String(values["base-dir"])
      : path.dirname(path.resolve(imagesPath));
    const imageRows = await readCsv(imagesPath);
    imagesRowCount = imageRows.length;
    const seenKeys = new Set<string>();

    for (const row of imageRows) {
      const rowNumber = getRowNumber(row);
      const rowLabel = rowNumber ? `Row ${rowNumber}` : "Row ?";
      const productSlug = slugify(pick(row, ["product_slug", "slug", "product"]));
      const fileSpec = pick(row, ["file", "file_path", "filepath", "path"]);
      if (!productSlug) {
        addIssue(issues, "error", `${rowLabel}: Missing product_slug (images.csv).`);
        continue;
      }
      if (!fileSpec) {
        addIssue(issues, "error", `${rowLabel}: Missing file (images.csv).`);
        continue;
      }
      if (!productSlugs.has(productSlug)) {
        const suggestion = maybeSuggestSlug(productSlug, productSlugList);
        addIssue(
          issues,
          "error",
          `${rowLabel}: Unknown product_slug "${productSlug}" in images.csv.${suggestion ? ` Did you mean: ${suggestion}?` : ""}`,
        );
      }

      const basePosition = pick(row, ["position", "order", "index"]);
      if (basePosition && Number.isNaN(Number(basePosition))) {
        addIssue(issues, "error", `${rowLabel}: Invalid position "${basePosition}".`);
      }

      try {
        const resolved = await expandFileSpec(fileSpec, imagesBaseDir, { recursiveDirs });
        for (const filePath of resolved) {
          const key = `${productSlug}::${path.resolve(filePath)}`;
          if (seenKeys.has(key)) {
            addIssue(issues, "error", `${rowLabel}: Duplicate image assignment for ${key}.`);
            continue;
          }
          seenKeys.add(key);
          await assertNonEmptyFile(filePath);
          await assertMinImageEdge(filePath, minImageEdge);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const soft = message.startsWith("[IMAGE_TOO_SMALL]");
        const cleaned = message.replace(/^\[(IMAGE_TOO_SMALL|IMAGE_UNSUPPORTED)\]\s*/, "");
        addIssue(issues, strict || !soft ? "error" : "warn", `${rowLabel}: ${cleaned}`);
      }
    }
  }

  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");

  for (const issue of warns) console.warn(`WARN: ${issue.message}`);
  for (const issue of errors) console.error(`ERROR: ${issue.message}`);

  console.log(
    [
      `Products: ${productRows.length}`,
      imagesRowCount !== null ? `Images rows: ${imagesRowCount}` : undefined,
      warns.length ? `Warnings: ${warns.length}` : undefined,
      errors.length ? `Errors: ${errors.length}` : "Errors: 0",
    ]
      .filter(Boolean)
      .join(" | "),
  );

  if (errors.length) {
    throw new Error(`Validation failed with ${errors.length} error(s).`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
