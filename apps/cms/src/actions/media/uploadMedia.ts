"use server";

import type { ImageOrientation, MediaItem } from "@acme/types";
import { validateShopName } from "@platform-core/shops";
import { promises as fs } from "fs";
import * as path from "path";
import sharp from "sharp";
import { ulid } from "ulid";

import { ensureAuthorized } from "../common/auth";
import {
  readMetadata,
  uploadsDir,
  writeMetadata,
} from "../media.helpers";
import type { MediaMetadataEntry } from "../media.helpers";
import { extractTagsFromFormData } from "./mediaUtils";

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
  let type: "image" | "video";
  let buffer: Buffer;

  if (file.type.startsWith("image/")) {
    type = "image";
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) throw new Error("File too large");

    buffer = Buffer.from(await new Response(file).arrayBuffer());
    const { width, height } = await sharp(buffer).metadata();

    if (
      width &&
      height &&
      requiredOrientation === "landscape" &&
      width < height
    ) {
      throw new Error("Image orientation must be landscape");
    }

    if (
      width &&
      height &&
      requiredOrientation === "portrait" &&
      width >= height
    ) {
      throw new Error("Image orientation must be portrait");
    }

    try {
      // placeholder for resize/optimisation – ensures the buffer is valid
      await sharp(buffer).toBuffer();
    } catch (err) {
      if (err instanceof Error && /orientation must be/i.test(err.message)) {
        throw err;
      }
      throw new Error("Failed to process image");
    }
  } else if (file.type.startsWith("video/")) {
    type = "video";
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) throw new Error("File too large");
    buffer = Buffer.from(await new Response(file).arrayBuffer());
  } else {
    throw new Error("Invalid file type");
  }

  /* -------------------------------- save file ----------------------------- */

  const safeShop = validateShopName(shop);
  const dir = uploadsDir(safeShop);
  await fs.mkdir(dir, { recursive: true });

  const ext =
    path.extname(file.name) || (type === "video" ? ".mp4" : ".jpg");
  const filename = `${ulid()}${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);

  const size = buffer.byteLength;
  const uploadedAt = new Date().toISOString();

  const meta = await readMetadata(safeShop);
  const entry: MediaMetadataEntry = {
    title,
    altText,
    type,
    size,
    uploadedAt,
  };
  if (tags !== undefined) {
    entry.tags = tags;
  }

  meta[filename] = entry;
  await writeMetadata(safeShop, meta);

  const result: MediaItem = {
    url: path.posix.join("/uploads", safeShop, filename),
    title,
    altText,
    type,
    size,
    uploadedAt,
  };
  if (tags !== undefined) {
    result.tags = tags;
  }
  return result;
}
