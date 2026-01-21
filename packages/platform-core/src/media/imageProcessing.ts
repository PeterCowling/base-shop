import "server-only";

import { createHash } from "node:crypto";
/**
 * LAUNCH-13a: Image Batch Processing
 *
 * Utilities for processing images:
 * - Resize to multiple sizes (thumbnail, medium, large)
 * - Optimize for web (compression, format conversion)
 * - Generate responsive image sets
 * - Extract and validate dimensions
 */
import { existsSync, mkdirSync,readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname,join } from "node:path";

// ============================================================
// Types
// ============================================================

/**
 * Image format for output.
 */
export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

/**
 * Image size preset.
 */
export interface ImageSizePreset {
  /** Preset name (e.g., "thumbnail", "medium", "large") */
  name: string;
  /** Maximum width in pixels */
  maxWidth: number;
  /** Maximum height in pixels */
  maxHeight: number;
  /** Quality (1-100) */
  quality: number;
  /** Output format */
  format: ImageFormat;
  /** Suffix added to filename */
  suffix: string;
}

/**
 * Default size presets for e-commerce images.
 */
export const DEFAULT_SIZE_PRESETS: ImageSizePreset[] = [
  {
    name: "thumbnail",
    maxWidth: 150,
    maxHeight: 150,
    quality: 80,
    format: "webp",
    suffix: "-thumb",
  },
  {
    name: "small",
    maxWidth: 300,
    maxHeight: 300,
    quality: 85,
    format: "webp",
    suffix: "-sm",
  },
  {
    name: "medium",
    maxWidth: 600,
    maxHeight: 600,
    quality: 85,
    format: "webp",
    suffix: "-md",
  },
  {
    name: "large",
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 90,
    format: "webp",
    suffix: "-lg",
  },
  {
    name: "original",
    maxWidth: 2400,
    maxHeight: 2400,
    quality: 90,
    format: "webp",
    suffix: "",
  },
];

/**
 * Options for image processing.
 */
export interface ImageProcessingOptions {
  /** Size presets to generate */
  presets?: ImageSizePreset[];
  /** Output directory (defaults to same as input) */
  outputDir?: string;
  /** Whether to preserve original file */
  preserveOriginal?: boolean;
  /** Strip EXIF metadata */
  stripMetadata?: boolean;
  /** Generate hash-based filenames for cache busting */
  hashFilenames?: boolean;
}

/**
 * Result of processing a single image.
 */
export interface ProcessedImage {
  /** Original filename */
  original: string;
  /** Generated variants */
  variants: ProcessedVariant[];
  /** Content hash of original */
  hash: string;
  /** Original dimensions */
  originalWidth: number;
  originalHeight: number;
}

/**
 * A single processed variant.
 */
export interface ProcessedVariant {
  /** Preset name */
  preset: string;
  /** Output path */
  path: string;
  /** Output filename */
  filename: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** File size in bytes */
  size: number;
  /** Format */
  format: ImageFormat;
}

/**
 * Result of batch processing.
 */
export interface BatchProcessResult {
  /** Total images processed */
  total: number;
  /** Successfully processed */
  success: number;
  /** Failed to process */
  failed: number;
  /** Processed images */
  images: ProcessedImage[];
  /** Errors encountered */
  errors: Array<{ file: string; error: string }>;
}

// ============================================================
// Image Dimension Extraction (Pure JS - no sharp dependency)
// ============================================================

/**
 * Extract dimensions from a JPEG file.
 */
function extractJpegDimensions(
  buffer: Buffer
): { width: number; height: number } | null {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;

    const marker = buffer[offset + 1];

    // Skip padding bytes
    if (marker === 0xff) {
      offset++;
      continue;
    }

    // End of image or invalid
    if (marker === 0xd9 || marker === 0x00) return null;

    // SOF markers contain dimensions
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    // Skip to next marker
    const length = buffer.readUInt16BE(offset + 2);
    offset += 2 + length;
  }

  return null;
}

/**
 * Extract dimensions from a PNG file.
 */
function extractPngDimensions(
  buffer: Buffer
): { width: number; height: number } | null {
  // PNG signature check
  const signature = buffer.slice(0, 8);
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!signature.equals(pngSig)) return null;

  // IHDR chunk starts at byte 8
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  return { width, height };
}

/**
 * Extract dimensions from a WebP file.
 */
function extractWebpDimensions(
  buffer: Buffer
): { width: number; height: number } | null {
  // RIFF header check
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WEBP") return null;

  const chunkType = buffer.toString("ascii", 12, 16);

  if (chunkType === "VP8 ") {
    // Lossy WebP
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  } else if (chunkType === "VP8L") {
    // Lossless WebP
    const bits = buffer.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  } else if (chunkType === "VP8X") {
    // Extended WebP
    const width = (buffer.readUIntLE(24, 3) + 1);
    const height = (buffer.readUIntLE(27, 3) + 1);
    return { width, height };
  }

  return null;
}

/**
 * Extract dimensions from an image file.
 */
export function extractImageDimensions(
  filePath: string
): { width: number; height: number } | null {
  if (!existsSync(filePath)) return null;

  const buffer = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return extractJpegDimensions(buffer);
    case ".png":
      return extractPngDimensions(buffer);
    case ".webp":
      return extractWebpDimensions(buffer);
    default:
      return null;
  }
}

/**
 * Calculate hash of image content.
 */
export function hashImageContent(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

// ============================================================
// Image Processing (requires sharp - optional dependency)
// ============================================================

/**
 * Check if sharp is available.
 */
export async function isSharpAvailable(): Promise<boolean> {
  try {
    await import("sharp");
    return true;
  } catch {
    return false;
  }
}

/**
 * Process a single image through all presets.
 *
 * Requires sharp to be installed. If not available, returns dimensions only.
 */
export async function processImage(
  inputPath: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const presets = options.presets ?? DEFAULT_SIZE_PRESETS;
  const outputDir = options.outputDir ?? dirname(inputPath);
  const hashFilenames = options.hashFilenames ?? false;

  // Extract original dimensions
  const dimensions = extractImageDimensions(inputPath);
  if (!dimensions) {
    throw new Error(`Cannot extract dimensions from: ${inputPath}`);
  }

  const hash = hashImageContent(inputPath);
  const baseName = basename(inputPath, extname(inputPath));

  const result: ProcessedImage = {
    original: inputPath,
    variants: [],
    hash,
    originalWidth: dimensions.width,
    originalHeight: dimensions.height,
  };

  // Try to use sharp for actual processing
  let sharp: typeof import("sharp") | undefined;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    // sharp not available - return dimensions only without processing
    console.warn(
      "sharp not installed. Install with: pnpm add sharp"
    );
    return result;
  }

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Process each preset
  for (const preset of presets) {
    try {
      const outputFilename = hashFilenames
        ? `${baseName}-${hash}${preset.suffix}.${preset.format}`
        : `${baseName}${preset.suffix}.${preset.format}`;

      const outputPath = join(outputDir, outputFilename);

      // Calculate target dimensions maintaining aspect ratio
      const scale = Math.min(
        preset.maxWidth / dimensions.width,
        preset.maxHeight / dimensions.height,
        1 // Don't upscale
      );

      const targetWidth = Math.round(dimensions.width * scale);
      const targetHeight = Math.round(dimensions.height * scale);

      // Process with sharp
      let pipeline = sharp(inputPath).resize(targetWidth, targetHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });

      // Strip metadata if requested
      if (options.stripMetadata !== false) {
        pipeline = pipeline.rotate(); // Auto-rotate based on EXIF, then strip
      }

      // Convert to target format
      switch (preset.format) {
        case "jpeg":
          pipeline = pipeline.jpeg({ quality: preset.quality });
          break;
        case "png":
          pipeline = pipeline.png({
            quality: preset.quality,
            compressionLevel: 9,
          });
          break;
        case "webp":
          pipeline = pipeline.webp({ quality: preset.quality });
          break;
        case "avif":
          pipeline = pipeline.avif({ quality: preset.quality });
          break;
      }

      // Write output
      const info = await pipeline.toFile(outputPath);

      result.variants.push({
        preset: preset.name,
        path: outputPath,
        filename: outputFilename,
        width: info.width,
        height: info.height,
        size: info.size,
        format: preset.format,
      });
    } catch (err) {
      console.error(`Failed to process ${inputPath} for preset ${preset.name}:`, err);
    }
  }

  return result;
}

/**
 * Process multiple images in batch.
 */
export async function processImageBatch(
  inputPaths: string[],
  options: ImageProcessingOptions = {}
): Promise<BatchProcessResult> {
  const result: BatchProcessResult = {
    total: inputPaths.length,
    success: 0,
    failed: 0,
    images: [],
    errors: [],
  };

  for (const inputPath of inputPaths) {
    try {
      const processed = await processImage(inputPath, options);
      result.images.push(processed);
      result.success++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        file: inputPath,
        error: (err as Error).message,
      });
    }
  }

  return result;
}

// ============================================================
// Responsive Image Set Generation
// ============================================================

/**
 * Responsive image srcset entry.
 */
export interface SrcSetEntry {
  url: string;
  width: number;
  descriptor: string;
}

/**
 * Generate srcset string from processed variants.
 */
export function generateSrcSet(
  variants: ProcessedVariant[],
  baseUrl: string = ""
): string {
  return variants
    .filter((v) => v.width > 0)
    .sort((a, b) => a.width - b.width)
    .map((v) => `${baseUrl}${v.filename} ${v.width}w`)
    .join(", ");
}

/**
 * Generate sizes attribute for responsive images.
 */
export function generateSizes(breakpoints: Array<{ maxWidth: number; size: string }>): string {
  return breakpoints
    .map((bp) => `(max-width: ${bp.maxWidth}px) ${bp.size}`)
    .concat(["100vw"])
    .join(", ");
}

/**
 * Default responsive breakpoints.
 */
export const DEFAULT_BREAKPOINTS = [
  { maxWidth: 640, size: "100vw" },
  { maxWidth: 768, size: "50vw" },
  { maxWidth: 1024, size: "33vw" },
];

// ============================================================
// Image Manifest Generation
// ============================================================

/**
 * Image manifest entry.
 */
export interface ImageManifestEntry {
  /** Original filename */
  filename: string;
  /** Content hash */
  hash: string;
  /** Original dimensions */
  width: number;
  height: number;
  /** Aspect ratio */
  aspectRatio: number;
  /** Available variants */
  variants: Record<
    string,
    {
      filename: string;
      width: number;
      height: number;
      size: number;
    }
  >;
  /** Generated srcset */
  srcSet?: string;
}

/**
 * Generate manifest from batch processing results.
 */
export function generateImageManifest(
  result: BatchProcessResult,
  baseUrl: string = ""
): Record<string, ImageManifestEntry> {
  const manifest: Record<string, ImageManifestEntry> = {};

  for (const image of result.images) {
    const key = basename(image.original, extname(image.original));

    const entry: ImageManifestEntry = {
      filename: basename(image.original),
      hash: image.hash,
      width: image.originalWidth,
      height: image.originalHeight,
      aspectRatio: image.originalWidth / image.originalHeight,
      variants: {},
    };

    for (const variant of image.variants) {
      entry.variants[variant.preset] = {
        filename: variant.filename,
        width: variant.width,
        height: variant.height,
        size: variant.size,
      };
    }

    if (image.variants.length > 0) {
      entry.srcSet = generateSrcSet(image.variants, baseUrl);
    }

    manifest[key] = entry;
  }

  return manifest;
}

/**
 * Write manifest to JSON file.
 */
export function writeImageManifest(
  manifest: Record<string, ImageManifestEntry>,
  outputPath: string
): void {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
}

// ============================================================
// Validation
// ============================================================

/**
 * Validate image meets requirements.
 */
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImageValidationRules {
  /** Minimum width */
  minWidth?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Minimum height */
  minHeight?: number;
  /** Maximum height */
  maxHeight?: number;
  /** Minimum aspect ratio (width/height) */
  minAspectRatio?: number;
  /** Maximum aspect ratio (width/height) */
  maxAspectRatio?: number;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Allowed formats */
  allowedFormats?: string[];
}

/**
 * Default validation rules for product images.
 */
export const DEFAULT_VALIDATION_RULES: ImageValidationRules = {
  minWidth: 600,
  maxWidth: 4000,
  minHeight: 600,
  maxHeight: 4000,
  minAspectRatio: 0.5,
  maxAspectRatio: 2.0,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: [".jpg", ".jpeg", ".png", ".webp"],
};

/**
 * Validate an image file against rules.
 */
export function validateImage(
  filePath: string,
  rules: ImageValidationRules = DEFAULT_VALIDATION_RULES
): ImageValidationResult {
  const result: ImageValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!existsSync(filePath)) {
    result.valid = false;
    result.errors.push("File does not exist");
    return result;
  }

  // Check format
  const ext = extname(filePath).toLowerCase();
  if (rules.allowedFormats && !rules.allowedFormats.includes(ext)) {
    result.valid = false;
    result.errors.push(
      `Invalid format: ${ext}. Allowed: ${rules.allowedFormats.join(", ")}`
    );
  }

  // Check file size
  const stats = statSync(filePath);
  if (rules.maxFileSize && stats.size > rules.maxFileSize) {
    result.valid = false;
    result.errors.push(
      `File too large: ${Math.round(stats.size / 1024 / 1024)}MB. Max: ${Math.round(rules.maxFileSize / 1024 / 1024)}MB`
    );
  }

  // Check dimensions
  const dimensions = extractImageDimensions(filePath);
  if (!dimensions) {
    result.warnings.push("Could not extract dimensions");
    return result;
  }

  if (rules.minWidth && dimensions.width < rules.minWidth) {
    result.valid = false;
    result.errors.push(
      `Width too small: ${dimensions.width}px. Min: ${rules.minWidth}px`
    );
  }

  if (rules.maxWidth && dimensions.width > rules.maxWidth) {
    result.warnings.push(
      `Width exceeds recommended: ${dimensions.width}px. Max: ${rules.maxWidth}px`
    );
  }

  if (rules.minHeight && dimensions.height < rules.minHeight) {
    result.valid = false;
    result.errors.push(
      `Height too small: ${dimensions.height}px. Min: ${rules.minHeight}px`
    );
  }

  if (rules.maxHeight && dimensions.height > rules.maxHeight) {
    result.warnings.push(
      `Height exceeds recommended: ${dimensions.height}px. Max: ${rules.maxHeight}px`
    );
  }

  // Check aspect ratio
  const aspectRatio = dimensions.width / dimensions.height;
  if (rules.minAspectRatio && aspectRatio < rules.minAspectRatio) {
    result.valid = false;
    result.errors.push(
      `Aspect ratio too narrow: ${aspectRatio.toFixed(2)}. Min: ${rules.minAspectRatio}`
    );
  }

  if (rules.maxAspectRatio && aspectRatio > rules.maxAspectRatio) {
    result.valid = false;
    result.errors.push(
      `Aspect ratio too wide: ${aspectRatio.toFixed(2)}. Max: ${rules.maxAspectRatio}`
    );
  }

  return result;
}
