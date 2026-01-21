#!/usr/bin/env node
/**
 * Batch Image Upload Script (LAUNCH-16)
 *
 * Upload multiple images to a shop's media library in a single operation.
 * Supports local files and directories, with automatic dimension extraction
 * and manifest generation.
 *
 * Usage:
 *   pnpm batch-upload-images --shop <id> --source <path> [options]
 *
 * Options:
 *   --shop <id>         Target shop ID (required)
 *   --source <path>     Source file or directory (required)
 *   --recursive         Recursively scan directories (default: false)
 *   --pattern <glob>    File pattern to match (default: *.{jpg,jpeg,png,webp})
 *   --tags <tags>       Comma-separated tags to apply to all uploads
 *   --orientation <o>   Required orientation: landscape, portrait, or any (default: any)
 *   --dry-run           Show what would be uploaded without uploading
 *   --verbose           Show detailed output
 *   --generate-manifest Generate imageDimensions.json manifest
 *   --manifest-path <p> Path to write manifest (default: data/shops/<shop>/imageDimensions.json)
 *   --concurrency <n>   Max concurrent uploads (default: 3)
 */
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import { join, basename, extname, relative, resolve, dirname } from "node:path";
import { minimatch } from "minimatch";

// ============================================================
// Types
// ============================================================

interface BatchUploadOptions {
  shopId: string;
  sourcePath: string;
  recursive: boolean;
  pattern: string;
  tags: string[];
  orientation: "landscape" | "portrait" | "any";
  dryRun: boolean;
  verbose: boolean;
  generateManifest: boolean;
  manifestPath?: string;
  concurrency: number;
}

interface ImageFile {
  absolutePath: string;
  relativePath: string;
  filename: string;
  size: number;
}

interface UploadResult {
  file: ImageFile;
  success: boolean;
  url?: string;
  width?: number;
  height?: number;
  error?: string;
}

interface BatchResult {
  total: number;
  uploaded: number;
  failed: number;
  skipped: number;
  results: UploadResult[];
  manifestPath?: string;
}

// ============================================================
// Argument Parsing
// ============================================================

function parseArgs(args: string[]): BatchUploadOptions {
  const options: BatchUploadOptions = {
    shopId: "",
    sourcePath: "",
    recursive: false,
    pattern: "*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}",
    tags: [],
    orientation: "any",
    dryRun: false,
    verbose: false,
    generateManifest: false,
    concurrency: 3,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--shop":
        options.shopId = nextArg || "";
        i++;
        break;
      case "--source":
        options.sourcePath = nextArg || "";
        i++;
        break;
      case "--recursive":
      case "-r":
        options.recursive = true;
        break;
      case "--pattern":
        options.pattern = nextArg || options.pattern;
        i++;
        break;
      case "--tags":
        options.tags = (nextArg || "").split(",").map((t) => t.trim()).filter(Boolean);
        i++;
        break;
      case "--orientation":
        if (nextArg === "landscape" || nextArg === "portrait" || nextArg === "any") {
          options.orientation = nextArg;
        }
        i++;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--generate-manifest":
        options.generateManifest = true;
        break;
      case "--manifest-path":
        options.manifestPath = nextArg || "";
        i++;
        break;
      case "--concurrency":
        options.concurrency = parseInt(nextArg || "3", 10) || 3;
        i++;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
    }
  }

  return options;
}

function printUsage(): void {
  console.log(`
Batch Image Upload Script (LAUNCH-16)

Usage:
  pnpm batch-upload-images --shop <id> --source <path> [options]

Options:
  --shop <id>           Target shop ID (required)
  --source <path>       Source file or directory (required)
  --recursive, -r       Recursively scan directories
  --pattern <glob>      File pattern (default: *.{jpg,jpeg,png,webp})
  --tags <tags>         Comma-separated tags for all uploads
  --orientation <o>     Required: landscape, portrait, or any (default: any)
  --dry-run             Show what would be uploaded without uploading
  --verbose, -v         Show detailed output
  --generate-manifest   Generate imageDimensions.json manifest
  --manifest-path <p>   Custom manifest path
  --concurrency <n>     Max concurrent uploads (default: 3)
  --help, -h            Show this help

Examples:
  # Upload all images from a directory
  pnpm batch-upload-images --shop my-shop --source ./product-images

  # Upload recursively with tags
  pnpm batch-upload-images --shop my-shop --source ./assets -r --tags "product,hero"

  # Generate manifest only (with dry-run to preview)
  pnpm batch-upload-images --shop my-shop --source ./images --generate-manifest --dry-run
`);
}

// ============================================================
// File Discovery
// ============================================================

function discoverImages(
  sourcePath: string,
  pattern: string,
  recursive: boolean,
  baseDir?: string
): ImageFile[] {
  const resolvedPath = resolve(sourcePath);
  const base = baseDir ?? resolvedPath;

  if (!existsSync(resolvedPath)) {
    throw new Error(`Source path does not exist: ${resolvedPath}`);
  }

  const stat = statSync(resolvedPath);

  if (stat.isFile()) {
    const filename = basename(resolvedPath);
    if (minimatch(filename, pattern, { nocase: true })) {
      return [{
        absolutePath: resolvedPath,
        relativePath: relative(dirname(resolvedPath), resolvedPath),
        filename,
        size: stat.size,
      }];
    }
    return [];
  }

  if (!stat.isDirectory()) {
    return [];
  }

  const files: ImageFile[] = [];
  const entries = readdirSync(resolvedPath);

  for (const entry of entries) {
    const entryPath = join(resolvedPath, entry);
    const entryStat = statSync(entryPath);

    if (entryStat.isFile()) {
      if (minimatch(entry, pattern, { nocase: true })) {
        files.push({
          absolutePath: entryPath,
          relativePath: relative(base, entryPath),
          filename: entry,
          size: entryStat.size,
        });
      }
    } else if (entryStat.isDirectory() && recursive) {
      files.push(...discoverImages(entryPath, pattern, recursive, base));
    }
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

// ============================================================
// Image Dimension Extraction (Inline to avoid import issues)
// ============================================================

interface ImageDimensions {
  format: "jpeg" | "png" | "webp";
  width: number;
  height: number;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RIFF_SIGNATURE = Buffer.from("RIFF");
const WEBP_SIGNATURE = Buffer.from("WEBP");

function isPngStart(buf: Buffer): boolean {
  return buf.length >= PNG_SIGNATURE.length && buf.subarray(0, 8).equals(PNG_SIGNATURE);
}

function isJpegStart(buf: Buffer): boolean {
  return buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8;
}

function isWebpStart(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.subarray(0, 4).equals(RIFF_SIGNATURE) &&
    buf.subarray(8, 12).equals(WEBP_SIGNATURE)
  );
}

function isJpegSofMarker(marker: number): boolean {
  return (
    (marker >= 0xc0 && marker <= 0xc3) ||
    (marker >= 0xc5 && marker <= 0xc7) ||
    (marker >= 0xc9 && marker <= 0xcb) ||
    (marker >= 0xcd && marker <= 0xcf)
  );
}

function parsePngDimensions(buf: Buffer): ImageDimensions | null {
  if (!isPngStart(buf)) return null;
  if (buf.length < 24) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!width || !height) return null;
  return { format: "png", width, height };
}

function parseJpegDimensions(buf: Buffer): ImageDimensions | null {
  if (!isJpegStart(buf)) return null;

  let offset = 2;
  while (offset < buf.length) {
    while (offset < buf.length && buf[offset] !== 0xff) offset += 1;
    if (offset >= buf.length) break;

    while (offset < buf.length && buf[offset] === 0xff) offset += 1;
    if (offset >= buf.length) break;

    const marker = buf[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;

    if (offset + 2 > buf.length) return null;
    const length = buf.readUInt16BE(offset);
    offset += 2;
    if (length < 2) return null;

    if (isJpegSofMarker(marker)) {
      if (offset + 5 > buf.length) return null;
      const height = buf.readUInt16BE(offset + 1);
      const width = buf.readUInt16BE(offset + 3);
      if (!width || !height) return null;
      return { format: "jpeg", width, height };
    }

    offset += length - 2;
  }

  return null;
}

function parseWebpDimensions(buf: Buffer): ImageDimensions | null {
  if (!isWebpStart(buf)) return null;

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const chunkType = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (dataOffset + chunkSize > buf.length) break;

    if (chunkType === "VP8X") {
      if (chunkSize < 10 || dataOffset + 10 > buf.length) return null;
      const widthMinus1 = buf.readUIntLE(dataOffset + 4, 3);
      const heightMinus1 = buf.readUIntLE(dataOffset + 7, 3);
      const width = widthMinus1 + 1;
      const height = heightMinus1 + 1;
      if (!width || !height) return null;
      return { format: "webp", width, height };
    }

    if (chunkType === "VP8 ") {
      if (chunkSize < 10 || dataOffset + 10 > buf.length) return null;
      const startCode = buf.subarray(dataOffset + 3, dataOffset + 6);
      if (startCode[0] !== 0x9d || startCode[1] !== 0x01 || startCode[2] !== 0x2a) return null;
      const width = buf.readUInt16LE(dataOffset + 6) & 0x3fff;
      const height = buf.readUInt16LE(dataOffset + 8) & 0x3fff;
      if (!width || !height) return null;
      return { format: "webp", width, height };
    }

    if (chunkType === "VP8L") {
      if (chunkSize < 5 || dataOffset + 5 > buf.length) return null;
      if (buf[dataOffset] !== 0x2f) return null;
      const bits = buf.readUInt32LE(dataOffset + 1);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      if (!width || !height) return null;
      return { format: "webp", width, height };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

function extractDimensions(buffer: Buffer): ImageDimensions | null {
  const png = parsePngDimensions(buffer);
  if (png) return png;
  const jpeg = parseJpegDimensions(buffer);
  if (jpeg) return jpeg;
  const webp = parseWebpDimensions(buffer);
  if (webp) return webp;
  return null;
}

// ============================================================
// Upload Logic
// ============================================================

async function uploadSingleImage(
  shopId: string,
  file: ImageFile,
  tags: string[],
  orientation: "landscape" | "portrait" | "any",
  verbose: boolean
): Promise<UploadResult> {
  try {
    // Read file
    const buffer = readFileSync(file.absolutePath);

    // Extract dimensions
    const dimensions = extractDimensions(buffer);
    if (!dimensions) {
      return {
        file,
        success: false,
        error: "Could not extract image dimensions (unsupported format)",
      };
    }

    // Check orientation
    if (orientation !== "any") {
      const isLandscape = dimensions.width >= dimensions.height;
      if (orientation === "landscape" && !isLandscape) {
        return {
          file,
          success: false,
          error: `Image is portrait but landscape required (${dimensions.width}x${dimensions.height})`,
        };
      }
      if (orientation === "portrait" && isLandscape) {
        return {
          file,
          success: false,
          error: `Image is landscape but portrait required (${dimensions.width}x${dimensions.height})`,
        };
      }
    }

    // Create File object for upload
    const ext = extname(file.filename).toLowerCase();
    const mimeType = ext === ".png" ? "image/png"
      : ext === ".webp" ? "image/webp"
      : "image/jpeg";

    const fileBlob = new File([buffer], file.filename, { type: mimeType });

    // Import and call uploadMediaFile
    const { uploadMediaFile } = await import("@acme/platform-core/repositories/media.server");

    const mediaItem = await uploadMediaFile({
      shop: shopId,
      file: fileBlob,
      tags: tags.length > 0 ? tags : undefined,
      requiredOrientation: orientation === "any" ? undefined : orientation,
    });

    if (verbose) {
      console.log(`  ✓ ${file.relativePath} → ${mediaItem.url} (${dimensions.width}x${dimensions.height})`);
    }

    return {
      file,
      success: true,
      url: mediaItem.url,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      file,
      success: false,
      error: message,
    };
  }
}

async function uploadBatch(
  options: BatchUploadOptions,
  files: ImageFile[]
): Promise<BatchResult> {
  const results: UploadResult[] = [];
  let uploaded = 0;
  let failed = 0;
  let skipped = 0;

  // Process in batches for concurrency control
  const batches: ImageFile[][] = [];
  for (let i = 0; i < files.length; i += options.concurrency) {
    batches.push(files.slice(i, i + options.concurrency));
  }

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map((file) =>
        uploadSingleImage(
          options.shopId,
          file,
          options.tags,
          options.orientation,
          options.verbose
        )
      )
    );

    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        uploaded++;
      } else {
        failed++;
        if (options.verbose) {
          console.log(`  ✗ ${result.file.relativePath}: ${result.error}`);
        }
      }
    }
  }

  // Generate manifest if requested
  let manifestPath: string | undefined;
  if (options.generateManifest) {
    const manifest: Record<string, { width: number; height: number }> = {};

    for (const result of results) {
      if (result.success && result.url && result.width && result.height) {
        manifest[result.url] = {
          width: result.width,
          height: result.height,
        };
      }
    }

    manifestPath = options.manifestPath || join("data", "shops", options.shopId, "imageDimensions.json");

    if (!options.dryRun) {
      await mkdir(dirname(manifestPath), { recursive: true });

      // Merge with existing manifest if present
      let existingManifest: Record<string, { width: number; height: number }> = {};
      if (existsSync(manifestPath)) {
        try {
          existingManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        } catch {
          // Ignore parse errors, start fresh
        }
      }

      const mergedManifest = { ...existingManifest, ...manifest };
      await writeFile(manifestPath, JSON.stringify(mergedManifest, null, 2));

      if (options.verbose) {
        console.log(`\nManifest written to: ${manifestPath}`);
        console.log(`  Entries: ${Object.keys(mergedManifest).length}`);
      }
    }
  }

  return {
    total: files.length,
    uploaded,
    failed,
    skipped,
    results,
    manifestPath,
  };
}

// ============================================================
// Dry Run
// ============================================================

async function dryRun(
  options: BatchUploadOptions,
  files: ImageFile[]
): Promise<BatchResult> {
  const results: UploadResult[] = [];

  console.log("\n=== Dry Run (no uploads will be performed) ===\n");
  console.log(`Shop: ${options.shopId}`);
  console.log(`Source: ${options.sourcePath}`);
  console.log(`Pattern: ${options.pattern}`);
  console.log(`Recursive: ${options.recursive}`);
  console.log(`Orientation: ${options.orientation}`);
  console.log(`Tags: ${options.tags.length > 0 ? options.tags.join(", ") : "(none)"}`);
  console.log(`Generate manifest: ${options.generateManifest}`);
  console.log(`\nImages found: ${files.length}\n`);

  const manifest: Record<string, { width: number; height: number }> = {};

  for (const file of files) {
    const buffer = readFileSync(file.absolutePath);
    const dimensions = extractDimensions(buffer);

    if (!dimensions) {
      console.log(`  ✗ ${file.relativePath} - unsupported format`);
      results.push({ file, success: false, error: "unsupported format" });
      continue;
    }

    // Check orientation
    if (options.orientation !== "any") {
      const isLandscape = dimensions.width >= dimensions.height;
      if (options.orientation === "landscape" && !isLandscape) {
        console.log(`  ✗ ${file.relativePath} - portrait (need landscape)`);
        results.push({ file, success: false, error: "orientation mismatch" });
        continue;
      }
      if (options.orientation === "portrait" && isLandscape) {
        console.log(`  ✗ ${file.relativePath} - landscape (need portrait)`);
        results.push({ file, success: false, error: "orientation mismatch" });
        continue;
      }
    }

    const sizeKb = Math.round(file.size / 1024);
    console.log(`  ✓ ${file.relativePath} (${dimensions.width}x${dimensions.height}, ${sizeKb}KB)`);

    const mockUrl = `/uploads/${options.shopId}/${file.filename}`;
    manifest[mockUrl] = { width: dimensions.width, height: dimensions.height };

    results.push({
      file,
      success: true,
      url: mockUrl,
      width: dimensions.width,
      height: dimensions.height,
    });
  }

  if (options.generateManifest) {
    const manifestPath = options.manifestPath || join("data", "shops", options.shopId, "imageDimensions.json");
    console.log(`\nWould write manifest to: ${manifestPath}`);
    console.log(`  Entries: ${Object.keys(manifest).length}`);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: files.length,
    uploaded: successful,
    failed,
    skipped: 0,
    results,
  };
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  // Validate required args
  if (!options.shopId) {
    console.error("Error: --shop is required");
    printUsage();
    process.exit(1);
  }

  if (!options.sourcePath) {
    console.error("Error: --source is required");
    printUsage();
    process.exit(1);
  }

  // Discover images
  console.log("\nDiscovering images...");
  const files = discoverImages(options.sourcePath, options.pattern, options.recursive);

  if (files.length === 0) {
    console.log("No images found matching the pattern.");
    process.exit(0);
  }

  console.log(`Found ${files.length} image(s)`);

  // Execute
  let result: BatchResult;

  if (options.dryRun) {
    result = await dryRun(options, files);
  } else {
    console.log("\nUploading...\n");
    result = await uploadBatch(options, files);
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Total:    ${result.total}`);
  console.log(`Uploaded: ${result.uploaded}`);
  console.log(`Failed:   ${result.failed}`);
  if (result.skipped > 0) {
    console.log(`Skipped:  ${result.skipped}`);
  }
  if (result.manifestPath) {
    console.log(`Manifest: ${result.manifestPath}`);
  }

  if (result.failed > 0) {
    console.log("\nFailed uploads:");
    for (const r of result.results.filter((r) => !r.success)) {
      console.log(`  - ${r.file.relativePath}: ${r.error}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
