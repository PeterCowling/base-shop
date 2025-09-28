// apps/cms/src/actions/media/mediaMetadataService.ts

import { validateShopName } from "@platform-core/shops";
import type { MediaItem } from "@acme/types";
import { promises as fs } from "fs";
import type { Stats } from "fs";
import * as path from "path";

import { readMetadata, uploadsDir, writeMetadata } from "../media.helpers";
import type { MediaMetadataEntry } from "../media.helpers";
import { normalizeTagsForStorage } from "./tagUtils";
import { buildMediaItem, listMediaFiles, inferMediaType } from "./mediaFileService";
// Use server-side translations loader inside async functions

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

export type UpdateMediaMetadataFields = {
  title?: string | null;
  altText?: string | null;
  tags?: string[] | null;
};

export type UpdateMediaMetadataParams = {
  shop: string;
  fileUrl: string;
  fields: UpdateMediaMetadataFields;
};

export async function updateMediaMetadataEntry({
  shop,
  fileUrl,
  fields,
}: UpdateMediaMetadataParams): Promise<MediaItem> {
  const { useTranslations: getServerTranslations } = await import(
    "@acme/i18n/useTranslations.server" // i18n-exempt -- INTL-000 module specifier [ttl=2026-03-31]
  );
  const t = await getServerTranslations("en");
  const safeShop = validateShopName(shop);
  const prefix = path.posix.join("/uploads", safeShop) + "/";
  const normalized = path.posix.normalize(fileUrl);

  if (!normalized.startsWith(prefix)) throw new Error(t("cms.media.errors.invalidPath"));

  const filename = normalized.slice(prefix.length);
  const dir = uploadsDir(safeShop);
  const fullPath = path.join(dir, filename);

  const relative = path.relative(dir, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(t("cms.media.errors.invalidPath"));
  }

  let stats: Stats | undefined;
  try {
    // Constrained to validated uploads directory
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
    stats = await fs.stat(fullPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      throw new Error(t("cms.media.errors.notFound"));
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

  return buildMediaItem(safeShop, dir, filename, updated, stats);
}

export async function getMediaOverviewForShop(
  shop: string
): Promise<MediaOverview> {
  try {
    const files = await listMediaFiles(shop);
    return buildOverview(files);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return buildOverview([]);
    }
    throw err;
  }
}
