import { validateShopName } from "@platform-core/shops";
import type { MediaItem } from "@acme/types";
import { promises as fs } from "fs";
import type { Stats } from "fs";
import * as path from "path";

import {
  readMetadata,
  uploadsDir,
} from "../media.helpers";
import type { MediaMetadataEntry } from "../media.helpers";

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

export function extractTagsFromFormData(
  formData: FormData
): string[] | undefined {
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

export function normalizeTagsForStorage(
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

export async function toMediaItem(
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

export async function collectMediaItems(shop: string): Promise<MediaItem[]> {
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

export function buildOverview(files: MediaItem[]) {
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
