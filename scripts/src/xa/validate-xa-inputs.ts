#!/usr/bin/env node

import path from "node:path";

import { toPositiveInt } from "@acme/lib";
import {
  catalogProductDraftSchema,
  expandFileSpec,
  readImageDimensions,
  rowToDraftInput,
  slugify,
} from "@acme/lib/xa";

import {
  loadCatalogRows,
  parseList,
} from "./catalogSyncCommon";

type ValidateOptions = {
  productsPath: string;
  recursive: boolean;
  strict: boolean;
};

function printHelp(): void {
  console.log(`XA input validation

Usage:
  node --import tsx scripts/src/xa/validate-xa-inputs.ts --products <path> [options]

Options:
  --products <path>  Path to uploader products CSV (required)
  --recursive        Expand directory image specs recursively
  --strict           Fail on missing images or low-resolution images
`);
}

function parseArgs(argv: string[]): ValidateOptions {
  let productsPath = "";
  let recursive = false;
  let strict = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--products": {
        const value = argv[index + 1];
        if (!value) throw new Error("--products requires a path value.");
        productsPath = value;
        index += 1;
        break;
      }
      case "--recursive":
        recursive = true;
        break;
      case "--strict":
        strict = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!productsPath.trim()) throw new Error("--products is required.");
  return { productsPath, recursive, strict };
}

function minImageEdge(): number {
  return toPositiveInt(
    process.env.XA_UPLOADER_MIN_IMAGE_EDGE ??
      process.env.NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE ??
      1600,
    1600,
    1,
  );
}

function rowLabel(index: number): string {
  return `row ${index + 2}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const absoluteProductsPath = path.resolve(options.productsPath);
  const baseDir = path.dirname(absoluteProductsPath);
  const minEdge = minImageEdge();

  const { rows, missing } = await loadCatalogRows(absoluteProductsPath);
  if (missing) {
    console.log(`[xa-validate] products file not found, treating as empty: ${absoluteProductsPath}`);
    return;
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const seenSlugs = new Set<string>();
  const seenIds = new Set<string>();

  for (const [index, row] of rows.entries()) {
    const draftInput = rowToDraftInput(row);
    const parsed = catalogProductDraftSchema.safeParse(draftInput);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".") || "input";
        errors.push(`[${rowLabel(index)}] ${field}: ${issue.message}`);
      }
      continue;
    }

    const draft = parsed.data;
    const productSlug = slugify(draft.slug?.trim() || draft.title);
    if (!productSlug) {
      errors.push(`[${rowLabel(index)}] could not derive a product slug from title/slug.`);
      continue;
    }
    if (seenSlugs.has(productSlug)) {
      errors.push(`[${rowLabel(index)}] duplicate product slug "${productSlug}".`);
    } else {
      seenSlugs.add(productSlug);
    }

    const productId = (draft.id ?? "").trim();
    if (productId) {
      if (seenIds.has(productId)) {
        errors.push(`[${rowLabel(index)}] duplicate product id "${productId}".`);
      } else {
        seenIds.add(productId);
      }
    }

    const imageSpecs = parseList(draft.imageFiles);
    if (options.strict && imageSpecs.length === 0) {
      errors.push(`[${rowLabel(index)}] "${productSlug}" has no image_files entries.`);
    }

    const imageAltTexts = parseList(draft.imageAltTexts);
    if (imageAltTexts.length > 0 && imageAltTexts.length !== imageSpecs.length) {
      errors.push(
        `[${rowLabel(index)}] "${productSlug}" image_alt_texts count must match image_files count.`,
      );
    }

    for (const [specIndex, imageSpec] of imageSpecs.entries()) {
      let resolvedPaths: string[];
      try {
        resolvedPaths = await expandFileSpec(imageSpec, baseDir, {
          recursiveDirs: options.recursive,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (options.strict) {
          errors.push(`[${rowLabel(index)}] "${productSlug}" ${message}`);
        } else {
          warnings.push(`[${rowLabel(index)}] "${productSlug}" ${message}`);
        }
        continue;
      }

      if (options.strict && resolvedPaths.length === 0) {
        errors.push(`[${rowLabel(index)}] "${productSlug}" image spec "${imageSpec}" resolved 0 files.`);
      }

      for (const resolvedPath of resolvedPaths) {
        try {
          const dimensions = await readImageDimensions(resolvedPath);
          const shortestEdge = Math.min(dimensions.width, dimensions.height);
          if (options.strict && shortestEdge < minEdge) {
            errors.push(
              `[${rowLabel(index)}] "${productSlug}" image "${resolvedPath}" is ${dimensions.width}x${dimensions.height}; minimum shortest edge is ${minEdge}px.`,
            );
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (options.strict) {
            errors.push(`[${rowLabel(index)}] "${productSlug}" ${message}`);
          } else {
            warnings.push(`[${rowLabel(index)}] "${productSlug}" ${message}`);
          }
        }

        const expectedAlt = imageAltTexts[specIndex];
        if (!expectedAlt && options.strict) {
          warnings.push(
            `[${rowLabel(index)}] "${productSlug}" image "${resolvedPath}" has no explicit alt text (fallback to title will be used).`,
          );
        }
      }
    }
  }

  if (warnings.length > 0) {
    console.log("[xa-validate] warnings:");
    for (const warning of warnings) console.log(`  - ${warning}`);
  }

  if (errors.length > 0) {
    console.error("[xa-validate] validation failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(
    `[xa-validate] ok (${rows.length} row${rows.length === 1 ? "" : "s"}, strict=${options.strict ? "on" : "off"}, recursive=${options.recursive ? "on" : "off"})`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[xa-validate] fatal: ${message}`);
  process.exit(1);
});
