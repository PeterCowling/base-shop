// apps/cms/src/actions/media.helpers.ts

import { validateShopName } from "@platform-core/shops";
import { promises as fs } from "fs";
import * as path from "path";
import { writeJsonFile } from "@/lib/server/jsonIO";
import { normalizeTagsInput } from "./media/tagUtils";

export type MediaMetadataEntry = {
  title?: string;
  altText?: string;
  type?: "image" | "video";
  tags?: string[];
  uploadedAt?: string;
  size?: number;
};

export type MediaMetadata = Record<string, MediaMetadataEntry>;

export function uploadsDir(shop: string): string {
  const safeShop = validateShopName(shop);
  return path.join(process.cwd(), "public", "uploads", safeShop);
}

export function metadataPath(shop: string): string {
  return path.join(uploadsDir(shop), "metadata.json");
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

  if (typeof record.title === "string") {
    entry.title = record.title;
  }
  if (typeof record.altText === "string") {
    entry.altText = record.altText;
  }

  if (record.type === "video") {
    entry.type = "video";
  } else if (record.type === "image") {
    entry.type = "image";
  }

  const tags = normalizeTagsInput(record.tags);
  if (tags) {
    entry.tags = tags;
  } else if (Array.isArray(record.tags) && record.tags.length === 0) {
    entry.tags = [];
  }

  if (typeof record.uploadedAt === "string") {
    entry.uploadedAt = record.uploadedAt;
  }

  if (typeof record.size === "number" && Number.isFinite(record.size)) {
    entry.size = record.size;
  }

  return entry;
}

export async function readMetadata(shop: string): Promise<MediaMetadata> {
  try {
    // Path is constrained to a validated uploads directory for the given shop
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
    const data = await fs.readFile(metadataPath(shop), "utf8");
    const parsed = JSON.parse(data) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [
        key,
        sanitizeMetadataEntry(value),
      ])
    );
  } catch {
    return {};
  }
}

export async function writeMetadata(
  shop: string,
  data: MediaMetadata
): Promise<void> {
  await writeJsonFile(metadataPath(shop), data);
}
