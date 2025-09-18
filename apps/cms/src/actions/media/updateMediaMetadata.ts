"use server";

import type { MediaItem } from "@acme/types";
import { validateShopName } from "@platform-core/shops";
import { promises as fs } from "fs";
import type { Stats } from "fs";
import * as path from "path";

import { ensureAuthorized } from "../common/auth";
import {
  readMetadata,
  uploadsDir,
  writeMetadata,
} from "../media.helpers";
import type { MediaMetadataEntry } from "../media.helpers";
import {
  inferMediaType,
  normalizeTagsForStorage,
  toMediaItem,
} from "./mediaUtils";

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
