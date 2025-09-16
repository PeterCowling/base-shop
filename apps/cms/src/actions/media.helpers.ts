// apps/cms/src/actions/media.helpers.ts

import { validateShopName } from "@platform-core/shops";
import { promises as fs } from "fs";
import * as path from "path";
import { writeJsonFile } from "@/lib/server/jsonIO";

export type MediaMetadataEntry = {
  title?: string;
  altText?: string;
  type?: "image" | "video";
};

export type MediaMetadata = Record<string, MediaMetadataEntry>;

export function uploadsDir(shop: string): string {
  const safeShop = validateShopName(shop);
  return path.join(process.cwd(), "public", "uploads", safeShop);
}

export function metadataPath(shop: string): string {
  return path.join(uploadsDir(shop), "metadata.json");
}

export async function readMetadata(shop: string): Promise<MediaMetadata> {
  try {
    const data = await fs.readFile(metadataPath(shop), "utf8");
    return JSON.parse(data) as MediaMetadata;
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
