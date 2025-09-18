// apps/cms/src/actions/media/mediaFileService.ts

import { validateShopName } from "@platform-core/shops";
import type { ImageOrientation, MediaItem } from "@acme/types";
import { promises as fs } from "fs";
import type { Stats } from "fs";
import * as path from "path";
import sharp from "sharp";
import { ulid } from "ulid";

import {
  readMetadata,
  uploadsDir,
  writeMetadata,
} from "../media.helpers";
import type { MediaMetadataEntry } from "../media.helpers";
import { normalizeTagsForStorage } from "./tagUtils";

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".mkv",
  ".webm",
  ".avi",
  ".m4v",
]);

export function inferMediaType(
  filename: string,
  declaredType?: MediaMetadataEntry["type"]
): "image" | "video" {
  if (declaredType === "video") return "video";
  if (declaredType === "image") return "image";
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext) ? "video" : "image";
}

export async function buildMediaItem(
  shop: string,
  dir: string,
  filename: string,
  entry?: MediaMetadataEntry,
  stats?: Stats
): Promise<MediaItem> {
  let size = entry?.size;
  let uploadedAt = entry?.uploadedAt;

  if (stats) {
    if (size == null) size = stats.size;
    if (uploadedAt == null) uploadedAt = stats.mtime.toISOString();
  } else if (size == null || uploadedAt == null) {
    try {
      const stat = await fs.stat(path.join(dir, filename));
      if (size == null) size = stat.size;
      if (uploadedAt == null) uploadedAt = stat.mtime.toISOString();
    } catch {
      /* ignore missing stat information */
    }
  }

  return {
    url: path.posix.join("/uploads", shop, filename),
    title: entry?.title,
    altText: entry?.altText,
    tags: entry?.tags,
    type: inferMediaType(filename, entry?.type),
    size,
    uploadedAt,
  };
}

async function collectMediaItems(shop: string): Promise<MediaItem[]> {
  const safeShop = validateShopName(shop);
  const dir = uploadsDir(safeShop);
  const files = await fs.readdir(dir);
  const meta = await readMetadata(safeShop);

  const mediaFiles = files.filter((f) => f !== "metadata.json");
  const items = await Promise.all(
    mediaFiles.map((filename) => buildMediaItem(safeShop, dir, filename, meta[filename]))
  );

  return items;
}

export async function listMediaFiles(shop: string): Promise<MediaItem[]> {
  return collectMediaItems(shop);
}

export type UploadMediaFileParams = {
  shop: string;
  file: File;
  title?: string;
  altText?: string;
  tags?: string[];
  requiredOrientation?: ImageOrientation;
};

export async function uploadMediaFile({
  shop,
  file,
  title,
  altText,
  tags,
  requiredOrientation = "landscape",
}: UploadMediaFileParams): Promise<MediaItem> {
  const safeShop = validateShopName(shop);
  const dir = uploadsDir(safeShop);
  await fs.mkdir(dir, { recursive: true });

  let type: "image" | "video";
  let buffer: Buffer;

  if (file.type.startsWith("image/")) {
    type = "image";
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) throw new Error("File too large");

    buffer = Buffer.from(await file.arrayBuffer());
    const { width, height } = await sharp(buffer).metadata();

    if (
      width &&
      height &&
      requiredOrientation === "landscape" &&
      width < height
    ) {
      throw new Error("Image orientation must be landscape");
    }

    if (
      width &&
      height &&
      requiredOrientation === "portrait" &&
      width >= height
    ) {
      throw new Error("Image orientation must be portrait");
    }

    try {
      await sharp(buffer).toBuffer();
    } catch (err) {
      if (err instanceof Error && /orientation must be/i.test(err.message)) {
        throw err;
      }
      throw new Error("Failed to process image");
    }
  } else if (file.type.startsWith("video/")) {
    type = "video";
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) throw new Error("File too large");
    buffer = Buffer.from(await file.arrayBuffer());
  } else {
    throw new Error("Invalid file type");
  }

  const ext = path.extname(file.name) || (type === "video" ? ".mp4" : ".jpg");
  const filename = `${ulid()}${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);

  const size = typeof file.size === "number" ? file.size : buffer.byteLength;
  const uploadedAt = new Date().toISOString();

  const meta = await readMetadata(safeShop);
  const entry: MediaMetadataEntry = {
    title,
    altText,
    type,
    size,
    uploadedAt,
  };

  const normalizedTags = normalizeTagsForStorage(tags);
  if (normalizedTags !== undefined) {
    entry.tags = normalizedTags;
  }

  meta[filename] = entry;
  await writeMetadata(safeShop, meta);

  const result: MediaItem = {
    url: path.posix.join("/uploads", safeShop, filename),
    title,
    altText,
    type,
    size,
    uploadedAt,
  };

  if (normalizedTags !== undefined) {
    result.tags = normalizedTags;
  }

  return result;
}

export async function deleteMediaFile(
  shop: string,
  filePath: string
): Promise<void> {
  const safeShop = validateShopName(shop);
  const prefix = path.posix.join("/uploads", safeShop) + "/";
  const normalized = path.posix.normalize(filePath);

  if (!normalized.startsWith(prefix)) throw new Error("Invalid file path");

  const filename = normalized.slice(prefix.length);
  const dir = uploadsDir(safeShop);
  const fullPath = path.join(dir, filename);

  const relative = path.relative(dir, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file path");
  }

  await fs.unlink(fullPath).catch(() => {
    /* ignore – file might already be gone */
  });

  const meta = await readMetadata(safeShop);
  if (meta[filename]) {
    delete meta[filename];
    await writeMetadata(safeShop, meta);
  }
}

