// apps/cms/src/actions/media.server.ts
"use server";

import type { ImageOrientation, MediaItem } from "@acme/types";

import { ensureAuthorized } from "./common/auth";
import {
  deleteMediaFile,
  listMediaFiles,
  uploadMediaFile,
} from "./media/mediaFileService";
import {
  getMediaOverviewForShop,
  updateMediaMetadataEntry,
  type MediaOverview,
  type UpdateMediaMetadataFields,
} from "./media/mediaMetadataService";
import { extractTagsFromFormData } from "./media/tagUtils";

export type { MediaOverview, UpdateMediaMetadataFields };

export async function listMedia(shop: string): Promise<MediaItem[]> {
  await ensureAuthorized();

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
  await ensureAuthorized();

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    throw new Error("No file provided");
  }
  const file = fileEntry as File;

  const title = formData.get("title")?.toString();
  const altText = formData.get("altText")?.toString();
  const tags = extractTagsFromFormData(formData);

  return uploadMediaFile({
    shop,
    file,
    title,
    altText,
    tags,
    requiredOrientation,
  });
}

export async function updateMediaMetadata(
  shop: string,
  fileUrl: string,
  fields: UpdateMediaMetadataFields
): Promise<MediaItem> {
  await ensureAuthorized();
  return updateMediaMetadataEntry({ shop, fileUrl, fields });
}

export async function getMediaOverview(shop: string): Promise<MediaOverview> {
  await ensureAuthorized();

  try {
    return await getMediaOverviewForShop(shop);
  } catch (err) {
    console.error("Failed to load media overview", err);
    throw new Error("Failed to load media overview");
  }
}

export async function deleteMedia(shop: string, filePath: string): Promise<void> {
  await deleteMediaFile(shop, filePath);
}
