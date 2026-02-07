import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";

import { ulid } from "ulid";

import type { ImageOrientation, MediaItem } from "@acme/types";

import { validateShopName } from "../shops";

import { MediaError } from "./media.errors";
import {
  buildMediaItem,
  ensureUploadsDir,
  inferMediaType,
  type MediaMetadataEntry,
  normalizeTagsForStorage,
  readMediaMetadata,
  resolveFilenameForUrl,
  type UpdateMediaMetadataFields,
  uploadsDir,
  writeMediaMetadata,
} from "./media.metadata.server";
import { buildR2PublicUrl, deleteObjectFromR2,getR2Config, putObjectToR2 } from "./media.r2.server";

export { isMediaError, MEDIA_ERROR_DEFS, MediaError, type MediaErrorCode } from "./media.errors";
export type {
  MediaMetadata,
  MediaMetadataEntry,
  MediaOverview,
  UpdateMediaMetadataFields,
} from "./media.metadata.server";
export { getMediaOverviewForShop,listMediaFiles } from "./media.metadata.server";
export { readMediaMetadata, writeMediaMetadata } from "./media.metadata.server";

async function readFileToBuffer(file: File): Promise<Buffer> {
  const anyFile = file as unknown as {
    arrayBuffer?: () => Promise<ArrayBuffer>;
    stream?: () => unknown;
    text?: () => Promise<string>;
  };

  if (typeof anyFile.arrayBuffer === "function") {
    return Buffer.from(await anyFile.arrayBuffer());
  }

  if (typeof anyFile.stream === "function") {
    const stream = anyFile.stream();
    if (stream && typeof (stream as ReadableStream).getReader === "function") {
      const reader = (stream as ReadableStream<Uint8Array>).getReader();
      const chunks: Buffer[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(Buffer.from(value));
      }
      return Buffer.concat(chunks);
    }

    if (stream && typeof (stream as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function") {
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<unknown>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
      }
      return Buffer.concat(chunks);
    }
  }

  if (typeof anyFile.text === "function") {
    return Buffer.from(await anyFile.text());
  }

  throw new Error("Unsupported File object");
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
  await ensureUploadsDir(safeShop);

  let type: "image" | "video";
  let buffer: Buffer;

  if (file.type.startsWith("image/")) {
    const sharp = (await import("sharp")).default;
    type = "image";
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) throw new MediaError("FILE_TOO_LARGE");

    buffer = await readFileToBuffer(file);
    const { width, height } = await sharp(buffer).metadata();

    if (width && height && requiredOrientation === "landscape" && width < height) {
      throw new MediaError("ORIENTATION_LANDSCAPE_REQUIRED");
    }

    if (width && height && requiredOrientation === "portrait" && width >= height) {
      throw new MediaError("ORIENTATION_PORTRAIT_REQUIRED");
    }

    try {
      await sharp(buffer).toBuffer();
    } catch (err) {
      throw new MediaError("PROCESS_IMAGE_FAILED", { cause: err });
    }
  } else if (file.type.startsWith("video/")) {
    type = "video";
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) throw new MediaError("FILE_TOO_LARGE");
    buffer = await readFileToBuffer(file);
  } else {
    throw new MediaError("INVALID_FILE_TYPE");
  }

  const ext = path.extname(file.name) || (type === "video" ? ".mp4" : ".jpg");
  const filename = `${ulid()}${ext}`;
  const localPath = path.join(uploadsDir(safeShop), filename);

  const size = typeof file.size === "number" ? file.size : buffer.byteLength;
  const uploadedAt = new Date().toISOString();

  const r2 = getR2Config();
  let url: string;
  let storage: "local" | "r2" = "local";
  let key: string | undefined;

  if (r2) {
    key = `uploads/${safeShop}/${filename}`;
    await putObjectToR2(
      r2,
      key,
      file.type || (type === "video" ? "video/mp4" : "image/jpeg"),
      buffer,
    );
    url = buildR2PublicUrl(r2, key);
    storage = "r2";
  } else {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: path is derived from validated shop and generated filename
    await fs.writeFile(localPath, buffer);
    url = path.posix.join("/uploads", safeShop, filename);
  }

  const meta = await readMediaMetadata(safeShop);
  const entry: MediaMetadataEntry = {
    url,
    title,
    altText,
    type,
    size,
    uploadedAt,
    storage,
    ...(key ? { key } : {}),
  };
  const normalizedTags = normalizeTagsForStorage(tags);
  if (normalizedTags !== undefined) entry.tags = normalizedTags;
  meta[filename] = entry;
  await writeMediaMetadata(safeShop, meta);

  return {
    url,
    title,
    altText,
    type,
    size,
    uploadedAt,
    ...(normalizedTags !== undefined ? { tags: normalizedTags } : {}),
  };
}

export async function updateMediaMetadataEntry(shop: string, fileUrl: string, fields: UpdateMediaMetadataFields): Promise<MediaItem> {
  const safeShop = validateShopName(shop);
  const normalizedUrl = (() => {
    if (!fileUrl || typeof fileUrl !== "string") return "";
    if (fileUrl.startsWith("/")) return path.posix.normalize(fileUrl);
    try {
      return path.posix.normalize(new URL(fileUrl).pathname);
    } catch {
      return "";
    }
  })();

  const localPrefix = path.posix.join("/uploads", safeShop) + "/";
  if (normalizedUrl.startsWith("/uploads/") && !normalizedUrl.startsWith(localPrefix)) {
    throw new MediaError("INVALID_FILE_PATH");
  }

  const meta = await readMediaMetadata(safeShop);
  const filename = resolveFilenameForUrl(safeShop, fileUrl, meta);
  if (!filename) throw new MediaError("NOT_FOUND");

  const existing = meta[filename] ?? {};
  const updated: MediaMetadataEntry = { ...existing };

  if ("title" in fields) {
    if (fields.title == null) delete updated.title;
    else updated.title = fields.title;
  }

  if ("altText" in fields) {
    if (fields.altText == null) delete updated.altText;
    else updated.altText = fields.altText;
  }

  if ("tags" in fields) {
    const normalizedTags = normalizeTagsForStorage(fields.tags);
    if (normalizedTags === undefined) delete updated.tags;
    else updated.tags = normalizedTags;
  }

  if (!updated.type) {
    updated.type = inferMediaType(filename, existing.type);
  }

  if (!updated.uploadedAt) {
    updated.uploadedAt = existing.uploadedAt ?? new Date().toISOString();
  }

  meta[filename] = updated;
  await writeMediaMetadata(safeShop, meta);
  return await buildMediaItem(safeShop, filename, updated);
}

export async function deleteMediaFile(shop: string, fileUrl: string): Promise<void> {
  const safeShop = validateShopName(shop);
  const normalizedUrl = (() => {
    if (!fileUrl || typeof fileUrl !== "string") return "";
    if (fileUrl.startsWith("/")) return path.posix.normalize(fileUrl);
    try {
      return path.posix.normalize(new URL(fileUrl).pathname);
    } catch {
      return "";
    }
  })();

  const localPrefix = path.posix.join("/uploads", safeShop) + "/";
  if (normalizedUrl.startsWith("/uploads/") && !normalizedUrl.startsWith(localPrefix)) {
    throw new MediaError("INVALID_FILE_PATH");
  }

  const meta = await readMediaMetadata(safeShop);
  const filename = resolveFilenameForUrl(safeShop, fileUrl, meta);
  if (!filename) throw new MediaError("NOT_FOUND");

  const entry = meta[filename] ?? {};

  if (entry.storage === "r2" && entry.key) {
    const r2 = getR2Config();
    if (r2) {
      await deleteObjectFromR2(r2, entry.key);
    }
  } else {
    const fullPath = path.join(uploadsDir(safeShop), filename);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: path derived from validated shop and normalized filename
    await fs.unlink(fullPath).catch(() => {});
  }

  if (meta[filename]) {
    delete meta[filename];
    await writeMediaMetadata(safeShop, meta);
  }
}
