#!/usr/bin/env node

import path from "node:path";

import {
  catalogProductDraftSchema,
  expandFileSpec,
  rowToDraftInput,
  slugify,
} from "@acme/lib/xa";

import {
  backupFileIfExists,
  buildCatalogMediaPath,
  handleToTitle,
  loadCatalogRows,
  parseList,
  sanitizePathSegment,
  toNonNegativeInt,
  writeJsonFile,
} from "./catalogSyncCommon";

type PipelineOptions = {
  productsPath: string;
  outPath: string;
  mediaOutPath: string;
  statePath: string;
  backupDir: string;
  simple: boolean;
  backup: boolean;
  replace: boolean;
  recursive: boolean;
  dryRun: boolean;
  strict: boolean;
};

type CatalogBrand = { handle: string; name: string };
type CatalogCollection = { handle: string; title: string; description?: string };
type CatalogMediaEntry = { type: "image"; path: string; altText: string };

type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  collection: string;
  price: number;
  compareAtPrice?: number;
  deposit: number;
  stock: number;
  forSale: boolean;
  forRental: boolean;
  media: CatalogMediaEntry[];
  sizes: string[];
  description: string;
  createdAt: string;
  popularity: number;
  taxonomy: {
    department: "women" | "men";
    category: "clothing" | "bags" | "jewelry";
    subcategory: string;
    color: string[];
    material: string[];
    fit?: string;
    length?: string;
    neckline?: string;
    sleeveLength?: string;
    pattern?: string;
    occasion?: string[];
    sizeClass?: string;
    strapStyle?: string;
    hardwareColor?: string;
    closureType?: string;
    fits?: string[];
    metal?: string;
    gemstone?: string;
    jewelrySize?: string;
    jewelryStyle?: string;
    jewelryTier?: string;
  };
  details?: {
    modelHeight?: string;
    modelSize?: string;
    fitNote?: string;
    fabricFeel?: string;
    care?: string;
    dimensions?: string;
    strapDrop?: string;
    whatFits?: string[];
    interior?: string[];
    sizeGuide?: string;
    warranty?: string;
  };
};

type CatalogPayload = {
  collections: CatalogCollection[];
  brands: CatalogBrand[];
  products: CatalogProduct[];
};

type MediaIndexPayload = {
  generatedAt: string;
  productsCsvPath: string;
  totals: {
    products: number;
    media: number;
    warnings: number;
  };
  items: Array<{
    productSlug: string;
    sourcePath: string;
    catalogPath: string;
    altText: string;
  }>;
};

function printHelp(): void {
  console.log(`XA pipeline runner

Usage:
  node --import tsx scripts/src/xa/run-xa-pipeline.ts --products <path> --out <path> --media-out <path> --state <path> [options]

Options:
  --products <path>   Source uploader CSV path (required)
  --out <path>        Catalog JSON output path (required)
  --media-out <path>  Media index JSON output path (required)
  --state <path>      Pipeline state file path (required)
  --backup-dir <dir>  Backup directory for --backup mode
  --simple            Compatibility flag (accepted)
  --backup            Backup previous outputs before writing
  --replace           Compatibility flag (accepted)
  --recursive         Expand image directory specs recursively
  --dry-run           Validate + transform but do not write files
  --strict            Fail on missing image specs or unresolved image files
`);
}

function parseArgs(argv: string[]): PipelineOptions {
  let productsPath = "";
  let outPath = "";
  let mediaOutPath = "";
  let statePath = "";
  let backupDir = "";
  let simple = false;
  let backup = false;
  let replace = false;
  let recursive = false;
  let dryRun = false;
  let strict = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--products": {
        const value = argv[index + 1];
        if (!value) throw new Error("--products requires a value.");
        productsPath = value;
        index += 1;
        break;
      }
      case "--out": {
        const value = argv[index + 1];
        if (!value) throw new Error("--out requires a value.");
        outPath = value;
        index += 1;
        break;
      }
      case "--media-out": {
        const value = argv[index + 1];
        if (!value) throw new Error("--media-out requires a value.");
        mediaOutPath = value;
        index += 1;
        break;
      }
      case "--state": {
        const value = argv[index + 1];
        if (!value) throw new Error("--state requires a value.");
        statePath = value;
        index += 1;
        break;
      }
      case "--backup-dir": {
        const value = argv[index + 1];
        if (!value) throw new Error("--backup-dir requires a value.");
        backupDir = value;
        index += 1;
        break;
      }
      case "--simple":
        simple = true;
        break;
      case "--backup":
        backup = true;
        break;
      case "--replace":
        replace = true;
        break;
      case "--recursive":
        recursive = true;
        break;
      case "--dry-run":
        dryRun = true;
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
  if (!outPath.trim()) throw new Error("--out is required.");
  if (!mediaOutPath.trim()) throw new Error("--media-out is required.");
  if (!statePath.trim()) throw new Error("--state is required.");
  if (!backupDir.trim()) backupDir = path.dirname(outPath);

  return {
    productsPath,
    outPath,
    mediaOutPath,
    statePath,
    backupDir,
    simple,
    backup,
    replace,
    recursive,
    dryRun,
    strict,
  };
}

function requiredString(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? "").trim();
  return trimmed || fallback;
}

function optionalString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed || undefined;
}

function buildFallbackId(slugValue: string): string {
  const token = sanitizePathSegment(slugValue, "product").replace(/\./g, "-");
  return `XA-${token.toUpperCase()}`;
}

function rowLabel(index: number): string {
  return `row ${index + 2}`;
}

function buildDetails(draft: ReturnType<typeof catalogProductDraftSchema.parse>) {
  const details = draft.details ?? {};
  const normalized = {
    modelHeight: optionalString(details.modelHeight),
    modelSize: optionalString(details.modelSize),
    fitNote: optionalString(details.fitNote),
    fabricFeel: optionalString(details.fabricFeel),
    care: optionalString(details.care),
    dimensions: optionalString(details.dimensions),
    strapDrop: optionalString(details.strapDrop),
    whatFits: parseList(details.whatFits),
    interior: parseList(details.interior),
    sizeGuide: optionalString(details.sizeGuide),
    warranty: optionalString(details.warranty),
  };

  const hasDetails = Boolean(
    normalized.modelHeight ||
      normalized.modelSize ||
      normalized.fitNote ||
      normalized.fabricFeel ||
      normalized.care ||
      normalized.dimensions ||
      normalized.strapDrop ||
      normalized.whatFits.length > 0 ||
      normalized.interior.length > 0 ||
      normalized.sizeGuide ||
      normalized.warranty,
  );
  if (!hasDetails) return undefined;

  return {
    ...(normalized.modelHeight ? { modelHeight: normalized.modelHeight } : {}),
    ...(normalized.modelSize ? { modelSize: normalized.modelSize } : {}),
    ...(normalized.fitNote ? { fitNote: normalized.fitNote } : {}),
    ...(normalized.fabricFeel ? { fabricFeel: normalized.fabricFeel } : {}),
    ...(normalized.care ? { care: normalized.care } : {}),
    ...(normalized.dimensions ? { dimensions: normalized.dimensions } : {}),
    ...(normalized.strapDrop ? { strapDrop: normalized.strapDrop } : {}),
    ...(normalized.whatFits.length > 0 ? { whatFits: normalized.whatFits } : {}),
    ...(normalized.interior.length > 0 ? { interior: normalized.interior } : {}),
    ...(normalized.sizeGuide ? { sizeGuide: normalized.sizeGuide } : {}),
    ...(normalized.warranty ? { warranty: normalized.warranty } : {}),
  };
}

async function buildCatalogArtifacts(options: {
  productsPath: string;
  rows: Awaited<ReturnType<typeof loadCatalogRows>>["rows"];
  recursive: boolean;
  strict: boolean;
}): Promise<{ catalog: CatalogPayload; mediaIndex: MediaIndexPayload; warnings: string[] }> {
  const baseDir = path.dirname(path.resolve(options.productsPath));
  const warnings: string[] = [];
  const seenSlugs = new Set<string>();
  const seenIds = new Set<string>();
  const collectionsByHandle = new Map<string, CatalogCollection>();
  const brandsByHandle = new Map<string, CatalogBrand>();
  const products: CatalogProduct[] = [];
  const mediaItems: MediaIndexPayload["items"] = [];

  for (const [index, row] of options.rows.entries()) {
    const draftInput = rowToDraftInput(row);
    const parsed = catalogProductDraftSchema.safeParse(draftInput);
    if (!parsed.success) {
      const issueMessage = parsed.error.issues
        .map((issue) => {
          const key = issue.path.join(".") || "input";
          return `${key}: ${issue.message}`;
        })
        .join("; ");
      throw new Error(`[${rowLabel(index)}] ${issueMessage}`);
    }

    const draft = parsed.data;
    const productSlug = slugify(draft.slug?.trim() || draft.title);
    if (!productSlug) {
      throw new Error(`[${rowLabel(index)}] could not derive product slug from title/slug.`);
    }
    if (seenSlugs.has(productSlug)) {
      throw new Error(`[${rowLabel(index)}] duplicate slug "${productSlug}".`);
    }
    seenSlugs.add(productSlug);

    const productId = requiredString(draft.id, buildFallbackId(productSlug));
    if (seenIds.has(productId)) {
      throw new Error(`[${rowLabel(index)}] duplicate id "${productId}".`);
    }
    seenIds.add(productId);

    const brandHandle = sanitizePathSegment(draft.brandHandle, "brand");
    const brandName = requiredString(draft.brandName, handleToTitle(brandHandle));
    brandsByHandle.set(brandHandle, { handle: brandHandle, name: brandName });

    const collectionHandle = sanitizePathSegment(
      draft.collectionHandle || draft.collectionTitle || draft.taxonomy.subcategory,
      `${draft.taxonomy.category}-${draft.taxonomy.subcategory}`,
    );
    const collectionTitle = requiredString(draft.collectionTitle, handleToTitle(collectionHandle));
    const collectionDescription = optionalString(draft.collectionDescription);
    const existingCollection = collectionsByHandle.get(collectionHandle);
    if (!existingCollection) {
      collectionsByHandle.set(collectionHandle, {
        handle: collectionHandle,
        title: collectionTitle,
        ...(collectionDescription ? { description: collectionDescription } : {}),
      });
    } else if (existingCollection.title !== collectionTitle) {
      warnings.push(
        `[${rowLabel(index)}] collection "${collectionHandle}" title mismatch (${existingCollection.title} vs ${collectionTitle}). Keeping first value.`,
      );
    }

    const imageSpecs = parseList(draft.imageFiles);
    const imageAltTexts = parseList(draft.imageAltTexts);
    if (options.strict && imageSpecs.length === 0) {
      throw new Error(`[${rowLabel(index)}] "${productSlug}" has no image_files entries.`);
    }

    const media: CatalogMediaEntry[] = [];
    const usedMediaNames = new Set<string>();

    for (const [specIndex, imageSpec] of imageSpecs.entries()) {
      let resolvedPaths: string[];
      try {
        resolvedPaths = await expandFileSpec(imageSpec, baseDir, {
          recursiveDirs: options.recursive,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (options.strict) {
          throw new Error(`[${rowLabel(index)}] "${productSlug}" ${message}`);
        }
        warnings.push(`[${rowLabel(index)}] "${productSlug}" ${message}`);
        continue;
      }

      const altText = imageAltTexts[specIndex] || draft.title || productSlug;
      for (const sourcePath of resolvedPaths) {
        const catalogPath = buildCatalogMediaPath({
          brandHandle,
          productSlug,
          sourcePath,
          usedNames: usedMediaNames,
        });
        media.push({ type: "image", path: catalogPath, altText });
        mediaItems.push({
          productSlug,
          sourcePath,
          catalogPath,
          altText,
        });
      }
    }

    if (options.strict && media.length === 0) {
      throw new Error(`[${rowLabel(index)}] "${productSlug}" produced no media entries.`);
    }

    const details = buildDetails(draft);
    const taxonomy = {
      department: draft.taxonomy.department,
      category: draft.taxonomy.category,
      subcategory: requiredString(draft.taxonomy.subcategory, "unknown"),
      color: parseList(draft.taxonomy.color),
      material: parseList(draft.taxonomy.material),
      ...(optionalString(draft.taxonomy.fit) ? { fit: optionalString(draft.taxonomy.fit) } : {}),
      ...(optionalString(draft.taxonomy.length)
        ? { length: optionalString(draft.taxonomy.length) }
        : {}),
      ...(optionalString(draft.taxonomy.neckline)
        ? { neckline: optionalString(draft.taxonomy.neckline) }
        : {}),
      ...(optionalString(draft.taxonomy.sleeveLength)
        ? { sleeveLength: optionalString(draft.taxonomy.sleeveLength) }
        : {}),
      ...(optionalString(draft.taxonomy.pattern)
        ? { pattern: optionalString(draft.taxonomy.pattern) }
        : {}),
      ...(parseList(draft.taxonomy.occasion).length > 0
        ? { occasion: parseList(draft.taxonomy.occasion) }
        : {}),
      ...(optionalString(draft.taxonomy.sizeClass)
        ? { sizeClass: optionalString(draft.taxonomy.sizeClass) }
        : {}),
      ...(optionalString(draft.taxonomy.strapStyle)
        ? { strapStyle: optionalString(draft.taxonomy.strapStyle) }
        : {}),
      ...(optionalString(draft.taxonomy.hardwareColor)
        ? { hardwareColor: optionalString(draft.taxonomy.hardwareColor) }
        : {}),
      ...(optionalString(draft.taxonomy.closureType)
        ? { closureType: optionalString(draft.taxonomy.closureType) }
        : {}),
      ...(parseList(draft.taxonomy.fits).length > 0 ? { fits: parseList(draft.taxonomy.fits) } : {}),
      ...(optionalString(draft.taxonomy.metal) ? { metal: optionalString(draft.taxonomy.metal) } : {}),
      ...(optionalString(draft.taxonomy.gemstone)
        ? { gemstone: optionalString(draft.taxonomy.gemstone) }
        : {}),
      ...(optionalString(draft.taxonomy.jewelrySize)
        ? { jewelrySize: optionalString(draft.taxonomy.jewelrySize) }
        : {}),
      ...(optionalString(draft.taxonomy.jewelryStyle)
        ? { jewelryStyle: optionalString(draft.taxonomy.jewelryStyle) }
        : {}),
      ...(optionalString(draft.taxonomy.jewelryTier)
        ? { jewelryTier: optionalString(draft.taxonomy.jewelryTier) }
        : {}),
    };

    const product: CatalogProduct = {
      id: productId,
      slug: productSlug,
      title: draft.title,
      brand: brandHandle,
      collection: collectionHandle,
      price: toNonNegativeInt(draft.price),
      ...(typeof draft.compareAtPrice === "number"
        ? { compareAtPrice: toNonNegativeInt(draft.compareAtPrice) }
        : {}),
      deposit: toNonNegativeInt(draft.deposit),
      stock: toNonNegativeInt(draft.stock),
      forSale: draft.forSale ?? true,
      forRental: draft.forRental ?? false,
      media,
      sizes: parseList(draft.sizes),
      description: draft.description,
      createdAt: draft.createdAt,
      popularity: toNonNegativeInt(draft.popularity),
      taxonomy,
      ...(details ? { details } : {}),
    };

    products.push(product);
  }

  const generatedAt = new Date().toISOString();
  products.sort((left, right) => left.slug.localeCompare(right.slug));

  const catalog: CatalogPayload = {
    collections: [...collectionsByHandle.values()].sort((left, right) =>
      left.handle.localeCompare(right.handle),
    ),
    brands: [...brandsByHandle.values()].sort((left, right) =>
      left.handle.localeCompare(right.handle),
    ),
    products,
  };

  const mediaIndex: MediaIndexPayload = {
    generatedAt,
    productsCsvPath: path.resolve(options.productsPath),
    totals: {
      products: products.length,
      media: mediaItems.length,
      warnings: warnings.length,
    },
    items: mediaItems.sort((left, right) => left.catalogPath.localeCompare(right.catalogPath)),
  };

  return { catalog, mediaIndex, warnings };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const productsPath = path.resolve(options.productsPath);
  const outPath = path.resolve(options.outPath);
  const mediaOutPath = path.resolve(options.mediaOutPath);
  const statePath = path.resolve(options.statePath);
  const backupDir = path.resolve(options.backupDir);

  const { rows, missing } = await loadCatalogRows(productsPath);
  if (missing) {
    console.log(`[xa-pipeline] products file not found, treating as empty: ${productsPath}`);
  }

  const { catalog, mediaIndex, warnings } = await buildCatalogArtifacts({
    productsPath,
    rows,
    recursive: options.recursive,
    strict: options.strict,
  });

  if (warnings.length > 0) {
    console.log("[xa-pipeline] warnings:");
    for (const warning of warnings) console.log(`  - ${warning}`);
  }

  if (!options.dryRun) {
    const backupRecords: string[] = [];
    if (options.backup) {
      const outBackup = await backupFileIfExists(outPath, backupDir);
      const mediaBackup = await backupFileIfExists(mediaOutPath, backupDir);
      if (outBackup) backupRecords.push(outBackup);
      if (mediaBackup) backupRecords.push(mediaBackup);
    }

    await writeJsonFile(outPath, catalog);
    await writeJsonFile(mediaOutPath, mediaIndex);
    await writeJsonFile(statePath, {
      version: 1,
      generatedAt: new Date().toISOString(),
      options: {
        simple: options.simple,
        backup: options.backup,
        replace: options.replace,
        recursive: options.recursive,
        dryRun: options.dryRun,
        strict: options.strict,
      },
      productsCsvPath: productsPath,
      outPath,
      mediaOutPath,
      totals: mediaIndex.totals,
      backups: backupRecords,
      warnings,
    });
  }

  console.log(
    `[xa-pipeline] ok (products=${catalog.products.length}, media=${mediaIndex.totals.media}, dryRun=${options.dryRun ? "on" : "off"}, strict=${options.strict ? "on" : "off"})`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[xa-pipeline] fatal: ${message}`);
  process.exit(1);
});
