#!/usr/bin/env node
/**
 * LAUNCH-13a: Image Batch Processing CLI
 *
 * Process images for web optimization:
 * - Resize to multiple sizes (thumbnail, medium, large, original)
 * - Convert to WebP format
 * - Generate responsive image manifest
 * - Validate images meet requirements
 *
 * Usage:
 *   pnpm process-images --input <path> [options]
 *
 * Options:
 *   --input <path>        Input file or directory (required)
 *   --output <path>       Output directory (default: same as input)
 *   --recursive           Process directories recursively
 *   --pattern <glob>      File pattern (default: *.{jpg,jpeg,png,webp})
 *   --presets <json>      Custom presets JSON file
 *   --validate-only       Only validate, don't process
 *   --hash-filenames      Use content hash in output filenames
 *   --manifest <path>     Write manifest to file
 *   --dry-run             Show what would be processed
 *   --verbose             Verbose output
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

import { minimatch } from "minimatch";

import {
  DEFAULT_SIZE_PRESETS,
  DEFAULT_VALIDATION_RULES,
  generateImageManifest,
  type ImageSizePreset,
  type ImageValidationRules,
  processImageBatch,
  validateImage,
} from "@acme/platform-core/media";

import { ensureRuntime } from "./runtime";

// ============================================================
// CLI Parsing
// ============================================================

interface ProcessOptions {
  inputPath: string;
  outputPath?: string;
  recursive: boolean;
  pattern: string;
  presets: ImageSizePreset[];
  validationRules: ImageValidationRules;
  validateOnly: boolean;
  hashFilenames: boolean;
  manifestPath?: string;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(args: string[]): ProcessOptions {
  const options: ProcessOptions = {
    inputPath: "",
    recursive: false,
    pattern: "*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}",
    presets: DEFAULT_SIZE_PRESETS,
    validationRules: DEFAULT_VALIDATION_RULES,
    validateOnly: false,
    hashFilenames: false,
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--input":
      case "-i":
        options.inputPath = next || "";
        i++;
        break;
      case "--output":
      case "-o":
        options.outputPath = next || undefined;
        i++;
        break;
      case "--recursive":
      case "-r":
        options.recursive = true;
        break;
      case "--pattern":
      case "-p":
        options.pattern = next || options.pattern;
        i++;
        break;
      case "--presets":
        if (next && existsSync(next)) {
          try {
            const content = require("fs").readFileSync(next, "utf8");
            options.presets = JSON.parse(content);
          } catch (e) {
            console.error(`Failed to load presets: ${(e as Error).message}`);
          }
        }
        i++;
        break;
      case "--validate-only":
        options.validateOnly = true;
        break;
      case "--hash-filenames":
        options.hashFilenames = true;
        break;
      case "--manifest":
        options.manifestPath = next || undefined;
        i++;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Image Batch Processing CLI (LAUNCH-13a)

Usage: pnpm process-images --input <path> [options]

Options:
  -i, --input <path>     Input file or directory (required)
  -o, --output <path>    Output directory (default: same as input)
  -r, --recursive        Process directories recursively
  -p, --pattern <glob>   File pattern (default: *.{jpg,jpeg,png,webp})
  --presets <json>       Custom presets JSON file
  --validate-only        Only validate, don't process
  --hash-filenames       Use content hash in output filenames
  --manifest <path>      Write manifest to file
  --dry-run              Show what would be processed
  -v, --verbose          Verbose output
  -h, --help             Show this help

Examples:
  pnpm process-images -i ./assets/products
  pnpm process-images -i ./images -o ./optimized -r
  pnpm process-images -i ./uploads --validate-only
  pnpm process-images -i ./src --manifest ./manifest.json

Default size presets:
  - thumbnail: 150x150, WebP, quality 80
  - small:     300x300, WebP, quality 85
  - medium:    600x600, WebP, quality 85
  - large:     1200x1200, WebP, quality 90
  - original:  2400x2400, WebP, quality 90
`);
}

// ============================================================
// File Discovery
// ============================================================

function discoverFiles(
  basePath: string,
  pattern: string,
  recursive: boolean
): string[] {
  const files: string[] = [];
  const absoluteBase = resolve(basePath);

  function scan(dir: string): void {
    if (!existsSync(dir)) return;

    const stat = statSync(dir);
    if (stat.isFile()) {
      // Single file input
      if (minimatch(dir, pattern, { matchBase: true })) {
        files.push(dir);
      }
      return;
    }

    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (recursive) {
          scan(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
          if (minimatch(entry.name, pattern, { matchBase: true })) {
            files.push(fullPath);
          }
        }
      }
    }
  }

  scan(absoluteBase);
  return files;
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.inputPath) {
    console.error("Error: --input is required");
    printHelp();
    process.exit(1);
  }

  if (!existsSync(options.inputPath)) {
    console.error(`Error: Input path does not exist: ${options.inputPath}`);
    process.exit(1);
  }

  console.log("=== Image Batch Processing ===\n");
  console.log(`Input: ${options.inputPath}`);
  if (options.outputPath) {
    console.log(`Output: ${options.outputPath}`);
  }
  console.log(`Recursive: ${options.recursive}`);
  console.log(`Pattern: ${options.pattern}`);
  console.log("");

  // Discover files
  const files = discoverFiles(
    options.inputPath,
    options.pattern,
    options.recursive
  );

  if (files.length === 0) {
    console.log("No matching files found.");
    process.exit(0);
  }

  console.log(`Found ${files.length} image(s) to process.\n`);

  if (options.dryRun) {
    console.log("Dry run - files that would be processed:");
    for (const file of files) {
      console.log(`  - ${file}`);
    }
    process.exit(0);
  }

  // Validate only mode
  if (options.validateOnly) {
    console.log("Validation mode - checking images...\n");
    let valid = 0;
    let invalid = 0;

    for (const file of files) {
      const result = validateImage(file, options.validationRules);
      if (result.valid) {
        valid++;
        if (options.verbose) {
          console.log(`✓ ${file}`);
          if (result.warnings.length > 0) {
            for (const warn of result.warnings) {
              console.log(`  ⚠ ${warn}`);
            }
          }
        }
      } else {
        invalid++;
        console.log(`✗ ${file}`);
        for (const err of result.errors) {
          console.log(`  - ${err}`);
        }
      }
    }

    console.log(`\nValidation complete: ${valid} valid, ${invalid} invalid`);
    process.exit(invalid > 0 ? 1 : 0);
  }

  // Process images
  console.log("Processing images...\n");

  const result = await processImageBatch(files, {
    presets: options.presets,
    outputDir: options.outputPath,
    hashFilenames: options.hashFilenames,
    stripMetadata: true,
  });

  // Print results
  console.log("\n=== Processing Complete ===");
  console.log(`Total:     ${result.total}`);
  console.log(`Success:   ${result.success}`);
  console.log(`Failed:    ${result.failed}`);

  if (options.verbose) {
    console.log("\nProcessed files:");
    for (const image of result.images) {
      console.log(`  ${image.original}`);
      console.log(`    Original: ${image.originalWidth}x${image.originalHeight}`);
      console.log(`    Hash: ${image.hash}`);
      console.log(`    Variants: ${image.variants.length}`);
      for (const variant of image.variants) {
        console.log(
          `      - ${variant.preset}: ${variant.width}x${variant.height} (${Math.round(variant.size / 1024)}KB)`
        );
      }
    }
  }

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    for (const err of result.errors) {
      console.log(`  ${err.file}: ${err.error}`);
    }
  }

  // Generate manifest
  if (options.manifestPath) {
    const manifest = generateImageManifest(result);
    await writeFile(options.manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\nManifest written to: ${options.manifestPath}`);
  }

  process.exit(result.failed > 0 ? 1 : 0);
}

if (process.argv[1]?.includes("process-images")) {
  ensureRuntime();
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}

export { discoverFiles,parseArgs };
