#!/usr/bin/env ts-node
/**
 * I18N-PIPE-00c: Legacy format migration script
 *
 * Converts legacy Record<Locale, string> format to TranslatableText format:
 *   { en: "...", de: "", it: "" }
 *   → { type: "inline", value: { en: "..." } }
 *
 * Targets:
 *   data/shops/<shop>/products.json (title, description fields)
 *   data/templates/<template>/products.json
 *   data/shops/<shop>/pages.json (seo.title, seo.description, seo.image)
 *   data/templates/<template>/pages.json
 *
 * Features:
 *   Creates .bak files for rollback
 *   Strips empty string values ("") as they indicate "not yet translated"
 *   Preserves non-empty values exactly
 *   Dry-run mode for preview
 */

import * as fs from "fs";
import * as path from "path";

// Types
interface LocalizedString {
  [locale: string]: string;
}

interface TranslatableText {
  type: "inline";
  value: LocalizedString;
}

interface LegacyProduct {
  id: string;
  title: LocalizedString;
  description?: LocalizedString;
  [key: string]: unknown;
}

interface MigratedProduct {
  id: string;
  title: TranslatableText;
  description?: TranslatableText;
  [key: string]: unknown;
}

interface LegacySeo {
  title: LocalizedString;
  description?: LocalizedString;
  image?: LocalizedString;
  noindex?: boolean;
}

interface MigratedSeo {
  title: TranslatableText;
  description?: TranslatableText;
  image?: TranslatableText;
  noindex?: boolean;
}

interface LegacyPage {
  id: string;
  seo: LegacySeo;
  [key: string]: unknown;
}

interface MigratedPage {
  id: string;
  seo: MigratedSeo;
  [key: string]: unknown;
}

// Configuration
const DATA_DIR = path.resolve(__dirname, "../../data");
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");
const RESTORE = process.argv.includes("--restore");

/**
 * Convert a LocalizedString to TranslatableText.
 * Strips empty string values.
 */
function convertToTranslatableText(
  value: LocalizedString | TranslatableText | undefined
): TranslatableText | undefined {
  if (!value) return undefined;

  // Already converted?
  if (
    typeof value === "object" &&
    "type" in value &&
    value.type === "inline"
  ) {
    return value as TranslatableText;
  }

  // Filter out empty strings
  const filtered: LocalizedString = {};
  let hasContent = false;

  for (const [locale, text] of Object.entries(value)) {
    if (typeof text === "string" && text.trim().length > 0) {
      filtered[locale] = text;
      hasContent = true;
    }
  }

  if (!hasContent) return undefined;

  return {
    type: "inline",
    value: filtered,
  };
}

/**
 * Migrate a products.json file.
 */
function migrateProducts(filePath: string): { migrated: number; skipped: number } {
  const content = fs.readFileSync(filePath, "utf-8");
  const products: LegacyProduct[] = JSON.parse(content);
  let migrated = 0;
  let skipped = 0;

  const migratedProducts: MigratedProduct[] = products.map((product) => {
    // Check if already migrated
    if (
      product.title &&
      typeof product.title === "object" &&
      "type" in product.title
    ) {
      skipped++;
      return product as unknown as MigratedProduct;
    }

    migrated++;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { title, description, ...rest } = product;

    const result: MigratedProduct = {
      ...rest,
      id: product.id,
      title: convertToTranslatableText(title)!,
    };

    if (description) {
      const desc = convertToTranslatableText(description);
      if (desc) {
        result.description = desc;
      }
    }

    return result;
  });

  if (!DRY_RUN && migrated > 0) {
    // Create backup
    fs.copyFileSync(filePath, filePath + ".bak");
    // Write migrated content
    fs.writeFileSync(filePath, JSON.stringify(migratedProducts, null, 2) + "\n");
  }

  return { migrated, skipped };
}

/**
 * Migrate a pages.json file (SEO fields only).
 */
function migratePages(filePath: string): { migrated: number; skipped: number } {
  const content = fs.readFileSync(filePath, "utf-8");
  const pages: LegacyPage[] = JSON.parse(content);
  let migrated = 0;
  let skipped = 0;

  const migratedPages: MigratedPage[] = pages.map((page) => {
    // Check if SEO title is already migrated
    if (
      page.seo?.title &&
      typeof page.seo.title === "object" &&
      "type" in page.seo.title
    ) {
      skipped++;
      return page as unknown as MigratedPage;
    }

    migrated++;

    const migratedSeo: MigratedSeo = {
      title: convertToTranslatableText(page.seo?.title)!,
    };

    if (page.seo?.description) {
      const desc = convertToTranslatableText(page.seo.description);
      if (desc) {
        migratedSeo.description = desc;
      }
    }

    if (page.seo?.image) {
      const img = convertToTranslatableText(page.seo.image);
      if (img) {
        migratedSeo.image = img;
      }
    }

    if (page.seo?.noindex !== undefined) {
      migratedSeo.noindex = page.seo.noindex;
    }

    return {
      ...page,
      seo: migratedSeo,
    };
  });

  if (!DRY_RUN && migrated > 0) {
    // Create backup
    fs.copyFileSync(filePath, filePath + ".bak");
    // Write migrated content
    fs.writeFileSync(filePath, JSON.stringify(migratedPages, null, 2) + "\n");
  }

  return { migrated, skipped };
}

/**
 * Restore from backup files.
 */
function restoreBackups(): void {
  const patterns = [
    "shops/*/products.json.bak",
    "templates/*/products.json.bak",
    "shops/*/pages.json.bak",
    "templates/*/pages.json.bak",
  ];

  let restored = 0;

  for (const pattern of patterns) {
    const baseDir = path.join(DATA_DIR, pattern.split("/")[0]);
    if (!fs.existsSync(baseDir)) continue;

    const dirs = fs.readdirSync(baseDir);
    for (const dir of dirs) {
      const bakFile = path.join(
        baseDir,
        dir,
        pattern.split("/").slice(2).join("/")
      );
      const origFile = bakFile.replace(".bak", "");

      if (fs.existsSync(bakFile)) {
        console.log(`Restoring ${origFile} from backup...`);
        fs.copyFileSync(bakFile, origFile);
        fs.unlinkSync(bakFile);
        restored++;
      }
    }
  }

  console.log(`Restored ${restored} files.`);
}

/**
 * Find all matching files.
 */
function findFiles(baseDir: string, filename: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(baseDir)) return files;

  const dirs = fs.readdirSync(baseDir);
  for (const dir of dirs) {
    const filePath = path.join(baseDir, dir, filename);
    if (fs.existsSync(filePath)) {
      files.push(filePath);
    }
  }

  return files;
}

/**
 * Main migration function.
 */
function main(): void {
  console.log("I18N-PIPE-00c: Legacy format migration");
  console.log("======================================");

  if (RESTORE) {
    restoreBackups();
    return;
  }

  if (DRY_RUN) {
    console.log("DRY RUN MODE - no files will be modified\n");
  }

  let totalMigrated = 0;
  let totalSkipped = 0;

  // Migrate products.json files
  console.log("\nMigrating products.json files...");
  const productFiles = [
    ...findFiles(path.join(DATA_DIR, "shops"), "products.json"),
    ...findFiles(path.join(DATA_DIR, "templates"), "products.json"),
  ];

  for (const file of productFiles) {
    const relativePath = path.relative(DATA_DIR, file);
    const { migrated, skipped } = migrateProducts(file);
    totalMigrated += migrated;
    totalSkipped += skipped;

    if (VERBOSE || migrated > 0) {
      console.log(`  ${relativePath}: ${migrated} migrated, ${skipped} skipped`);
    }
  }

  // Migrate pages.json files
  console.log("\nMigrating pages.json files (SEO fields)...");
  const pageFiles = [
    ...findFiles(path.join(DATA_DIR, "shops"), "pages.json"),
    ...findFiles(path.join(DATA_DIR, "templates"), "pages.json"),
  ];

  for (const file of pageFiles) {
    const relativePath = path.relative(DATA_DIR, file);
    const { migrated, skipped } = migratePages(file);
    totalMigrated += migrated;
    totalSkipped += skipped;

    if (VERBOSE || migrated > 0) {
      console.log(`  ${relativePath}: ${migrated} migrated, ${skipped} skipped`);
    }
  }

  console.log("\n======================================");
  console.log(`Total: ${totalMigrated} records migrated, ${totalSkipped} already migrated`);

  if (DRY_RUN) {
    console.log("\nTo apply changes, run without --dry-run");
  } else if (totalMigrated > 0) {
    console.log("\nBackup files created with .bak extension");
    console.log("To restore, run with --restore flag");
  }
}

main();
