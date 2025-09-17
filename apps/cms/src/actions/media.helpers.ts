// apps/cms/src/actions/media.helpers.ts

import { validateShopName } from "@platform-core/shops";
import { promises as fs } from "fs";
import * as path from "path";
import { writeJsonFile } from "@/lib/server/jsonIO";

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

function normalizeTags(value: unknown): string[] | undefined {
  if (value == null) return undefined;

  const pushTag = (acc: string[], tag: unknown) => {
    if (typeof tag !== "string") return acc;
    const trimmed = tag.trim();
    if (trimmed) acc.push(trimmed);
    return acc;
  };

  if (Array.isArray(value)) {
    const tags = value.reduce<string[]>(pushTag, []);
    return tags.length ? Array.from(new Set(tags)) : undefined;
  }

  if (typeof value === "string") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      /* ignore – treat as delimited string */
    }

    if (Array.isArray(parsed)) {
      const tags = parsed.reduce<string[]>(pushTag, []);
      return tags.length ? Array.from(new Set(tags)) : undefined;
    }

    if (typeof parsed === "string") {
      const single = parsed.trim();
      return single ? [single] : undefined;
    }

    const tags = value
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    return tags.length ? Array.from(new Set(tags)) : undefined;
  }

  return undefined;
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

  const tags = normalizeTags(record.tags);
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
