import "server-only";

import { existsSync } from "node:fs";
import { mkdir,writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

import { validateShopName } from "../shops";

import type { BrandKit, FaviconConfig, LogoVariants } from "./brandKit";

// ============================================================
// Types
// ============================================================

export interface AssetIngestOptions {
  /** Target shop ID */
  shopId: string;
  /** Source asset URL or local path */
  source: string;
  /** Asset slot (logo variant, favicon, etc.) */
  slot: AssetSlot;
  /** Optional: Validate dimensions */
  validateDimensions?: boolean;
  /** Optional: Custom filename */
  filename?: string;
}

export type AssetSlot =
  | { type: "logo"; variant: string }
  | { type: "favicon"; size?: string }
  | { type: "social-image" }
  | { type: "custom"; key: string };

export interface AssetIngestResult {
  success: boolean;
  /** Final asset URL (relative or CDN) */
  url?: string;
  /** Original source URL/path */
  source: string;
  /** Slot that was populated */
  slot: AssetSlot;
  /** Error message if failed */
  error?: string;
  /** Asset dimensions if extracted */
  dimensions?: { width: number; height: number };
}

export interface BatchIngestResult {
  total: number;
  succeeded: number;
  failed: number;
  results: AssetIngestResult[];
}

// ============================================================
// Asset Validation
// ============================================================

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  size?: number;
}

async function validateAssetUrl(url: string): Promise<ValidationResult> {
  try {
    // For local files, check existence
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (!existsSync(url)) {
        return { valid: false, error: `File not found: ${url}` };
      }
      return { valid: true };
    }

    // For remote URLs, do a HEAD request to check accessibility
    const response = await fetch(url, { method: "HEAD" });

    if (!response.ok) {
      return { valid: false, error: `URL returned ${response.status}` };
    }

    const contentType = response.headers.get("content-type")?.split(";")[0];
    const contentLength = response.headers.get("content-length");

    if (contentType && !ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return { valid: false, error: `Invalid content type: ${contentType}` };
    }

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > MAX_FILE_SIZE) {
        return { valid: false, error: `File too large: ${Math.round(size / 1024 / 1024)}MB` };
      }
      return { valid: true, mimeType: contentType ?? undefined, size };
    }

    return { valid: true, mimeType: contentType ?? undefined };
  } catch (error) {
    return { valid: false, error: `Failed to validate URL: ${(error as Error).message}` };
  }
}

// ============================================================
// Asset Ingestion
// ============================================================

/**
 * Ingest a single asset into the shop's brand kit storage.
 */
export async function ingestAsset(options: AssetIngestOptions): Promise<AssetIngestResult> {
  const { source, slot } = options;
  const shopId = validateShopName(options.shopId);

  // Validate the source asset
  const validation = await validateAssetUrl(source);
  if (!validation.valid) {
    return {
      success: false,
      source,
      slot,
      error: validation.error,
    };
  }

  // For remote URLs, we can reference them directly or download
  // For now, we'll reference them directly (CDN-friendly)
  if (source.startsWith("http://") || source.startsWith("https://")) {
    // Remote URL - use directly
    return {
      success: true,
      url: source,
      source,
      slot,
    };
  }

  // Local file - copy to shop assets directory
  try {
    const { readFile } = await import("node:fs/promises");
    const buffer = await readFile(source);

    const ext = extname(source) || ".png";
    const slotFilename = getFilenameForSlot(slot, ext, options.filename);

    const targetDir = join("data", "shops", shopId, "assets", "brand");
    const targetPath = join(targetDir, slotFilename);

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetPath, buffer);

    // Return relative URL
    const relativeUrl = `/assets/brand/${slotFilename}`;

    return {
      success: true,
      url: relativeUrl,
      source,
      slot,
    };
  } catch (error) {
    return {
      success: false,
      source,
      slot,
      error: `Failed to copy asset: ${(error as Error).message}`,
    };
  }
}

/**
 * Ingest multiple assets in batch.
 */
export async function ingestAssetBatch(
  shopId: string,
  assets: Array<{ source: string; slot: AssetSlot; filename?: string }>
): Promise<BatchIngestResult> {
  const results: AssetIngestResult[] = [];

  for (const asset of assets) {
    const result = await ingestAsset({
      shopId,
      source: asset.source,
      slot: asset.slot,
      filename: asset.filename,
    });
    results.push(result);
  }

  return {
    total: assets.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

// ============================================================
// Brand Kit Asset Population
// ============================================================

export interface PopulateBrandKitAssetsOptions {
  shopId: string;
  /** Logo sources keyed by variant */
  logos?: Record<string, string>;
  /** Favicon source (URL or path) */
  favicon?: string;
  /** Social share image source */
  socialImage?: string;
}

export interface PopulateBrandKitAssetsResult {
  success: boolean;
  brandKit: Partial<BrandKit>;
  errors: string[];
  warnings: string[];
}

/**
 * Populate brand kit assets from external sources.
 * Ingests all provided assets and returns a partial brand kit configuration.
 */
export async function populateBrandKitAssets(
  options: PopulateBrandKitAssetsOptions
): Promise<PopulateBrandKitAssetsResult> {
  const { shopId, logos, favicon, socialImage } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  const brandKit: Partial<BrandKit> = {};

  // Ingest logos
  if (logos && Object.keys(logos).length > 0) {
    const logoVariants: LogoVariants = {};

    for (const [variant, source] of Object.entries(logos)) {
      const result = await ingestAsset({
        shopId,
        source,
        slot: { type: "logo", variant },
      });

      if (result.success && result.url) {
        logoVariants[variant] = result.url;
      } else {
        warnings.push(`Failed to ingest logo variant '${variant}': ${result.error}`);
      }
    }

    if (Object.keys(logoVariants).length > 0) {
      brandKit.logo = logoVariants;
    }
  }

  // Ingest favicon
  if (favicon) {
    const result = await ingestAsset({
      shopId,
      source: favicon,
      slot: { type: "favicon" },
    });

    if (result.success && result.url) {
      brandKit.favicon = { primary: result.url };
    } else {
      errors.push(`Failed to ingest favicon: ${result.error}`);
    }
  }

  // Ingest social image
  if (socialImage) {
    const result = await ingestAsset({
      shopId,
      source: socialImage,
      slot: { type: "social-image" },
    });

    if (result.success && result.url) {
      brandKit.social = { defaultImage: result.url };
    } else {
      warnings.push(`Failed to ingest social image: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    brandKit,
    errors,
    warnings,
  };
}

// ============================================================
// Utilities
// ============================================================

function getFilenameForSlot(slot: AssetSlot, ext: string, customFilename?: string): string {
  if (customFilename) {
    return customFilename;
  }

  switch (slot.type) {
    case "logo":
      return `logo-${slot.variant}${ext}`;
    case "favicon":
      return slot.size ? `favicon-${slot.size}${ext}` : `favicon${ext}`;
    case "social-image":
      return `social-share${ext}`;
    case "custom":
      return `${slot.key}${ext}`;
  }
}

/**
 * Generate favicon sizes from a primary favicon image.
 * Requires sharp for image processing.
 */
export async function generateFaviconSizes(
  shopId: string,
  primaryFaviconPath: string
): Promise<FaviconConfig> {
  const safeShopId = validateShopName(shopId);

  try {
    const sharp = (await import("sharp")).default;
    const { readFile } = await import("node:fs/promises");

    const buffer = await readFile(primaryFaviconPath);

    const sizes = [16, 32, 48, 180, 192, 512] as const;
    const sizeMap: Record<string, string> = {};

    const targetDir = join("data", "shops", safeShopId, "assets", "brand", "favicons");
    await mkdir(targetDir, { recursive: true });

    for (const size of sizes) {
      const resized = await sharp(buffer)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      const filename = `favicon-${size}x${size}.png`;
      const targetPath = join(targetDir, filename);
      await writeFile(targetPath, resized);

      sizeMap[`${size}x${size}`] = `/assets/brand/favicons/${filename}`;
    }

    return {
      primary: `/assets/brand/favicons/favicon-32x32.png`,
      sizes: {
        "16x16": sizeMap["16x16"],
        "32x32": sizeMap["32x32"],
        "48x48": sizeMap["48x48"],
        "180x180": sizeMap["180x180"],
        "192x192": sizeMap["192x192"],
        "512x512": sizeMap["512x512"],
      },
    };
  } catch {
    // Return minimal config if sharp fails
    return {
      primary: primaryFaviconPath,
    };
  }
}
