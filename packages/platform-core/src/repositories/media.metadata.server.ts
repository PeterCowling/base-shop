import "server-only";

import type { MediaItem } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";
import { resolveDataRoot } from "../dataRoot";

type StorageBackend = "local" | "r2";

export type MediaMetadataEntry = {
  /**
   * Stable URL used by storefronts and the CMS UI. For local storage this is
   * typically `/uploads/<shop>/<filename>`. For R2 it’s an absolute public URL.
   */
  url?: string;
  title?: string;
  altText?: string;
  type?: "image" | "video";
  tags?: string[];
  uploadedAt?: string;
  size?: number;
  storage?: StorageBackend;
  /**
   * R2 object key (when `storage === "r2"`). Defaults to `uploads/<shop>/<filename>`.
   */
  key?: string;
};

export type MediaMetadata = Record<string, MediaMetadataEntry>;

export type UpdateMediaMetadataFields = {
  title?: string | null;
  altText?: string | null;
  tags?: string[] | null;
};

export type MediaOverview = {
  files: MediaItem[];
  totalBytes: number;
  imageCount: number;
  videoCount: number;
  recentUploads: MediaItem[];
};

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".mkv",
  ".webm",
  ".avi",
  ".m4v",
]);

function dataRoot(): string {
  return resolveDataRoot();
}

export function uploadsDir(shop: string): string {
  shop = validateShopName(shop);
  return path.join(dataRoot(), shop, "uploads");
}

function metadataPath(shop: string): string {
  return path.join(uploadsDir(shop), "metadata.json");
}

export async function ensureUploadsDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: path uses validated shop and trusted base
  await fs.mkdir(uploadsDir(shop), { recursive: true });
}

function isSafeBasename(filename: string): boolean {
  if (!filename) return false;
  if (filename === "." || filename === "..") return false;
  if (filename.includes("\0")) return false;
  if (filename.includes("/") || filename.includes("\\")) return false;
  return true;
}

function sanitizeMetadataEntry(value: unknown): MediaMetadataEntry {
  if (typeof value === "string") {
    return { title: value };
  }

  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;
  const entry: MediaMetadataEntry = {};

  if (typeof record.url === "string") entry.url = record.url;
  if (typeof record.title === "string") entry.title = record.title;
  if (typeof record.altText === "string") entry.altText = record.altText;

  if (record.type === "video") entry.type = "video";
  else if (record.type === "image") entry.type = "image";

  if (Array.isArray(record.tags)) {
    entry.tags = record.tags
      .map((tag) => (tag?.toString?.() ?? "").trim())
      .filter((tag) => tag.length > 0);
  }

  if (typeof record.uploadedAt === "string") entry.uploadedAt = record.uploadedAt;
  if (typeof record.size === "number" && Number.isFinite(record.size)) entry.size = record.size;

  if (record.storage === "local") entry.storage = "local";
  else if (record.storage === "r2") entry.storage = "r2";

  if (typeof record.key === "string") entry.key = record.key;

  return entry;
}

export async function readMediaMetadata(shop: string): Promise<MediaMetadata> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: path uses validated shop and trusted base
    const data = await fs.readFile(metadataPath(shop), "utf8");
    const parsed = JSON.parse(data) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [
        key,
        sanitizeMetadataEntry(value),
      ]),
    );
  } catch {
    return {};
  }
}

export async function writeMediaMetadata(shop: string, data: MediaMetadata): Promise<void> {
  await ensureUploadsDir(shop);
  const safeShop = validateShopName(shop);
  const target = metadataPath(safeShop);
  const tmp = `${target}.${Date.now()}.tmp`;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: temp path derived from validated shop and constant filename
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: path derived from validated shop and constant filename
  await fs.rename(tmp, target);
}

export function inferMediaType(
  filename: string,
  declaredType?: MediaMetadataEntry["type"],
): "image" | "video" {
  if (declaredType === "video") return "video";
  if (declaredType === "image") return "image";
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext) ? "video" : "image";
}

export async function buildMediaItem(
  shop: string,
  filename: string,
  entry?: MediaMetadataEntry,
): Promise<MediaItem> {
  const safeShop = validateShopName(shop);
  if (!isSafeBasename(filename)) {
    return {
      url: path.posix.join("/uploads", safeShop, encodeURIComponent(filename)),
      type: "image",
    };
  }

  const dir = uploadsDir(safeShop);

  let size = entry?.size;
  let uploadedAt = entry?.uploadedAt;

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: path uses validated shop and normalized filename
    const stat = await fs.stat(path.join(dir, filename));
    if (size == null) size = stat.size;
    if (uploadedAt == null) uploadedAt = stat.mtime.toISOString();
  } catch {
    // If file isn't present locally (e.g. R2-backed entries), rely on metadata.
  }

  const url = entry?.url ?? path.posix.join("/uploads", safeShop, filename);

  return {
    url,
    title: entry?.title,
    altText: entry?.altText,
    tags: entry?.tags,
    type: inferMediaType(filename, entry?.type),
    size,
    uploadedAt,
  };
}

export async function listMediaFiles(shop: string): Promise<MediaItem[]> {
  const safeShop = validateShopName(shop);
  const dir = uploadsDir(safeShop);
  const meta = await readMediaMetadata(safeShop);

  let diskFiles: string[] = [];
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: constrained to validated uploads directory
    diskFiles = await fs.readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
    diskFiles = [];
  }

  const filenames = new Set(
    [...diskFiles, ...Object.keys(meta)]
      .filter((f) => f !== "metadata.json")
      .filter(isSafeBasename),
  );

  return await Promise.all(
    [...filenames].map((filename) => buildMediaItem(safeShop, filename, meta[filename])),
  );
}

function buildOverview(files: MediaItem[]): MediaOverview {
  const totalBytes = files.reduce((sum, file) => sum + (file.size ?? 0), 0);
  let imageCount = 0;
  let videoCount = 0;
  for (const file of files) {
    if (file.type === "video") videoCount += 1;
    else imageCount += 1;
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

export async function getMediaOverviewForShop(shop: string): Promise<MediaOverview> {
  const files = await listMediaFiles(shop).catch((err) => {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw err;
  });
  return buildOverview(files);
}

export function normalizeTagsForStorage(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value)) return undefined;
  const tags = value.map((t) => String(t ?? "").trim()).filter(Boolean);
  return tags;
}

export function resolveFilenameForUrl(shop: string, fileUrl: string, meta: MediaMetadata): string | null {
  const safeShop = validateShopName(shop);

  const normalized = (() => {
    if (!fileUrl || typeof fileUrl !== "string") return "";
    if (fileUrl.startsWith("/")) return path.posix.normalize(fileUrl);
    try {
      return path.posix.normalize(new URL(fileUrl).pathname);
    } catch {
      return "";
    }
  })();

  const localPrefix = path.posix.join("/uploads", safeShop) + "/";
  if (normalized.startsWith(localPrefix)) {
    const filename = normalized.slice(localPrefix.length);
    return isSafeBasename(filename) ? filename : null;
  }

  for (const [filename, entry] of Object.entries(meta)) {
    if (!isSafeBasename(filename)) continue;
    if (entry.url === fileUrl) return filename;
    if (entry.key && normalized.endsWith(`/${entry.key}`)) return filename;
  }

  return null;
}

