// apps/cms/src/actions/media.server.ts
"use server";

import { validateShopName } from "@platform-core/shops";
import type { ImageOrientation, MediaItem } from "@acme/types";
import { promises as fs } from "fs";
import type { Stats } from "fs";
import * as path from "path";
import sharp from "sharp";
import { ulid } from "ulid";
import { ensureAuthorized } from "./common/auth";
import {
  readMetadata,
  uploadsDir,
  writeMetadata,
} from "./media.helpers";
import type { MediaMetadataEntry } from "./media.helpers";

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".mkv",
  ".webm",
  ".avi",
  ".m4v",
]);

function inferMediaType(
  filename: string,
  declaredType?: MediaMetadataEntry["type"]
): "image" | "video" {
  if (declaredType === "video") return "video";
  if (declaredType === "image") return "image";
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext) ? "video" : "image";
}

function cleanTagsList(tags: Iterable<string>): string[] {
  const seen = new Set<string>();
  for (const tag of tags) {
    if (typeof tag !== "string") continue;
    const trimmed = tag.trim();
    if (trimmed) seen.add(trimmed);
  }
  return Array.from(seen);
}

function parseTagsString(value: string): string[] {
  if (!value) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = undefined;
  }

  if (Array.isArray(parsed)) {
    return cleanTagsList(parsed.filter((tag): tag is string => typeof tag === "string"));
  }

  if (typeof parsed === "string") {
    return cleanTagsList([parsed]);
  }

  return cleanTagsList(value.split(/[,\n]/));
}

function extractTagsFromFormData(formData: FormData): string[] | undefined {
  const keys = ["tags", "tags[]"];
  const collected: string[] = [];
  let seen = false;

  for (const key of keys) {
    const entries = formData.getAll(key);
    if (entries.length > 0) {
      seen = true;
    }

    for (const entry of entries) {
      if (typeof entry !== "string") continue;
      collected.push(...parseTagsString(entry));
    }
  }

  if (!seen) return undefined;
  const cleaned = cleanTagsList(collected);
  return cleaned.length ? cleaned : [];
}

function normalizeTagsForStorage(
  tags: string[] | null | undefined
): string[] | undefined {
  if (tags === undefined) {
    return undefined;
  }
  if (tags === null) {
    return [];
  }
  const cleaned = cleanTagsList(tags);
  return cleaned.length ? cleaned : [];
}

async function toMediaItem(
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
    mediaFiles.map((filename) => toMediaItem(safeShop, dir, filename, meta[filename]))
  );

  return items;
}

function buildOverview(files: MediaItem[]) {
  const totalBytes = files.reduce((sum, file) => sum + (file.size ?? 0), 0);
  let imageCount = 0;
  let videoCount = 0;
  for (const file of files) {
    if (file.type === "video") {
      videoCount += 1;
    } else {
      imageCount += 1;
    }
  }

  const recentUploads = [...files]
    .sort((a, b) => {
      const aTime = a.uploadedAt ? Date.parse(a.uploadedAt) : 0;
      const bTime = b.uploadedAt ? Date.parse(b.uploadedAt) : 0;
      const safeA = Number.isFinite(aTime) ? aTime : 0;
      const safeB = Number.isFinite(bTime) ? bTime : 0;
      return safeB - safeA;
    })
    .slice(0, 5);

  return { files, totalBytes, imageCount, videoCount, recentUploads };
}

export type MediaOverview = ReturnType<typeof buildOverview>;

/* -------------------------------------------------------------------------- */
/*  List                                                                      */
/* -------------------------------------------------------------------------- */

export async function listMedia(shop: string): Promise<MediaItem[]> {
  await ensureAuthorized();

  try {
    return await collectMediaItems(shop);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }
    console.error("Failed to list media", err);
    throw new Error("Failed to list media");
  }
}

/* -------------------------------------------------------------------------- */
/*  Upload                                                                    */
/* -------------------------------------------------------------------------- */

export async function uploadMedia(
  shop: string,
  formData: FormData,
  requiredOrientation: ImageOrientation = "landscape"
): Promise<MediaItem> {
  await ensureAuthorized();

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    throw new Error("No file provided");
  }
  const file = fileEntry as File;

  const title = formData.get("title")?.toString();
  const altText = formData.get("altText")?.toString();
  const tags = extractTagsFromFormData(formData);
  let type: "image" | "video";
  let buffer: Buffer;

  if (file.type.startsWith("image/")) {
    type = "image";
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) throw new Error("File too large");

    buffer = Buffer.from(await new Response(file).arrayBuffer());
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
      // placeholder for resize/optimisation – ensures the buffer is valid
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
    buffer = Buffer.from(await new Response(file).arrayBuffer());
  } else {
    throw new Error("Invalid file type");
  }

  /* -------------------------------- save file ----------------------------- */

  const safeShop = validateShopName(shop);
  const dir = uploadsDir(safeShop);
  await fs.mkdir(dir, { recursive: true });

  const ext =
    path.extname(file.name) || (type === "video" ? ".mp4" : ".jpg");
  const filename = `${ulid()}${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);

  const size = buffer.length;
  const uploadedAt = new Date().toISOString();

  const meta = await readMetadata(safeShop);
  const entry: MediaMetadataEntry = {
    title,
    altText,
    type,
    size,
    uploadedAt,
  };
  if (tags !== undefined) {
    entry.tags = tags;
  }

  meta[filename] = entry;
  await writeMetadata(safeShop, meta);

  return {
    url: path.posix.join("/uploads", safeShop, filename),
    title,
    altText,
    tags: entry.tags,
    type,
    size,
    uploadedAt,
  };
}

/* -------------------------------------------------------------------------- */
/*  Update metadata                                                           */
/* -------------------------------------------------------------------------- */

export type UpdateMediaMetadataFields = {
  title?: string | null;
  altText?: string | null;
  tags?: string[] | null;
};

export async function updateMediaMetadata(
  shop: string,
  fileUrl: string,
  fields: UpdateMediaMetadataFields
): Promise<MediaItem> {
  await ensureAuthorized();

  const safeShop = validateShopName(shop);
  const prefix = path.posix.join("/uploads", safeShop) + "/";
  const normalized = path.posix.normalize(fileUrl);

  if (!normalized.startsWith(prefix)) throw new Error("Invalid file path");

  const filename = normalized.slice(prefix.length);
  const dir = uploadsDir(safeShop);
  const fullPath = path.join(dir, filename);

  const relative = path.relative(dir, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file path");
  }

  let stats: Stats | undefined;
  try {
    stats = await fs.stat(fullPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      throw new Error("Media file not found");
    }
    throw err;
  }

  const meta = await readMetadata(safeShop);
  const existing = meta[filename] ?? {};
  const updated: MediaMetadataEntry = { ...existing };

  if ("title" in fields) {
    if (fields.title == null) {
      delete updated.title;
    } else {
      updated.title = fields.title;
    }
  }

  if ("altText" in fields) {
    if (fields.altText == null) {
      delete updated.altText;
    } else {
      updated.altText = fields.altText;
    }
  }

  if ("tags" in fields) {
    const normalizedTags = normalizeTagsForStorage(fields.tags);
    if (normalizedTags === undefined) {
      delete updated.tags;
    } else {
      updated.tags = normalizedTags;
    }
  }

  if (!updated.type) {
    updated.type = inferMediaType(filename, existing.type);
  }

  if (updated.size == null && stats) {
    updated.size = stats.size;
  }

  if (!updated.uploadedAt) {
    updated.uploadedAt = existing.uploadedAt ?? stats?.mtime.toISOString();
  }

  meta[filename] = updated;
  await writeMetadata(safeShop, meta);

  return toMediaItem(safeShop, dir, filename, updated, stats);
}

/* -------------------------------------------------------------------------- */
/*  Overview                                                                  */
/* -------------------------------------------------------------------------- */

export async function getMediaOverview(shop: string) {
  await ensureAuthorized();

  try {
    const files = await collectMediaItems(shop);
    return buildOverview(files);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return buildOverview([]);
    }
    console.error("Failed to load media overview", err);
    throw new Error("Failed to load media overview");
  }
}

/* -------------------------------------------------------------------------- */
/*  Delete                                                                    */
/* -------------------------------------------------------------------------- */

export async function deleteMedia(
  shop: string,
  filePath: string
): Promise<void> {
  const prefix = path.posix.join("/uploads", validateShopName(shop)) + "/";
  const normalized = path.posix.normalize(filePath);

  if (!normalized.startsWith(prefix)) throw new Error("Invalid file path");

  const filename = normalized.slice(prefix.length);
  const dir = uploadsDir(shop);
  const fullPath = path.join(dir, filename);

  const relative = path.relative(dir, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file path");
  }

  await fs.unlink(fullPath).catch(() => {
    /* ignore – file might already be gone */
  });

  const meta = await readMetadata(shop);
  if (meta[filename]) {
    delete meta[filename];
    await writeMetadata(shop, meta);
  }
}
