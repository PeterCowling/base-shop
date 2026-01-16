// apps/cms/src/actions/media.server.ts
"use server";

import type { ImageOrientation, MediaItem } from "@acme/types";

import { ensureHasPermission } from "./common/auth";
import {
  deleteMediaFile,
  getMediaOverviewForShop,
  listMediaFiles,
  updateMediaMetadataEntry,
  uploadMediaFile,
  type MediaOverview,
  type UpdateMediaMetadataFields,
} from "@acme/platform-core/repositories/media.server";
import { isMediaError } from "@acme/platform-core/repositories/media.errors";
import { extractTagsFromFormData } from "./media/tagUtils";

export type { MediaOverview, UpdateMediaMetadataFields };

async function translateMediaError(err: unknown): Promise<string | null> {
  if (!isMediaError(err)) return null;
  const { useTranslations: getServerTranslations } = await import(
    "@acme/i18n/useTranslations.server" // i18n-exempt -- internal module specifier
  );
  const t = await getServerTranslations("en");
  return String(t(err.messageKey));
}

export async function listMedia(shop: string): Promise<MediaItem[]> {
  await ensureHasPermission("manage_media");

  try {
    return await listMediaFiles(shop);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }
    console.error("Failed to list media", err);
    throw new Error("Failed to list media");
  }
}

export async function uploadMedia(
  shop: string,
  formData: FormData,
  requiredOrientation: ImageOrientation = "landscape"
): Promise<MediaItem> {
  await ensureHasPermission("manage_media");

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    throw new Error("No file provided");
  }
  const file = fileEntry as File;

  const title = formData.get("title")?.toString();
  const altText = formData.get("altText")?.toString();
  const tags = extractTagsFromFormData(formData);

  try {
    return await uploadMediaFile({
      shop,
      file,
      title,
      altText,
      tags,
      requiredOrientation,
    });
  } catch (err) {
    const translated = await translateMediaError(err);
    if (translated) throw new Error(translated);
    throw err;
  }
}

export async function updateMediaMetadata(
  shop: string,
  fileUrl: string,
  fields: UpdateMediaMetadataFields
): Promise<MediaItem> {
  await ensureHasPermission("manage_media");
  try {
    return await updateMediaMetadataEntry(shop, fileUrl, fields);
  } catch (err) {
    const translated = await translateMediaError(err);
    if (translated) throw new Error(translated);
    throw err;
  }
}

export async function getMediaOverview(shop: string): Promise<MediaOverview> {
  await ensureHasPermission("manage_media");

  try {
    return await getMediaOverviewForShop(shop);
  } catch (err) {
    console.error("Failed to load media overview", err);
    throw new Error("Failed to load media overview");
  }
}

export async function deleteMedia(shop: string, filePath: string): Promise<void> {
  await ensureHasPermission("manage_media");
  try {
    await deleteMediaFile(shop, filePath);
  } catch (err) {
    const translated = await translateMediaError(err);
    if (translated) throw new Error(translated);
    throw err;
  }
}
