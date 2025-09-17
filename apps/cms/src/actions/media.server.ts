// apps/cms/src/actions/media.server.ts
"use server";

import { validateShopName } from "@platform-core/shops";
import type { ImageOrientation, MediaItem } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import sharp from "sharp";
import { ulid } from "ulid";
import { ensureAuthorized } from "./common/auth";
import {
  readMetadata,
  uploadsDir,
  writeMetadata,
} from "./media.helpers";

type MediaEntry = {
  filename: string;
  item: MediaItem;
  size: number;
  mtime: Date;
};

async function readMediaEntries(shop: string): Promise<MediaEntry[]> {
  const dir = uploadsDir(shop);

  try {
    const files = await fs.readdir(dir);
    const meta = await readMetadata(shop);

    const entries = await Promise.all(
      files
        .filter((file) => file !== "metadata.json")
        .map(async (filename) => {
          const stats = await fs.stat(path.join(dir, filename));
          const metaEntry = meta[filename] ?? {};

          const item: MediaItem = {
            url: path.posix.join("/uploads", shop, filename),
            title: metaEntry.title,
            altText: metaEntry.altText,
            type: metaEntry.type ?? "image",
          };

          return {
            filename,
            item,
            size: stats.size,
            mtime: stats.mtime,
          } satisfies MediaEntry;
        })
    );

    return entries;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }

    throw err;
  }
}

export interface MediaPlanLimits {
  storageBytes?: number | null;
  assets?: number | null;
}

export interface MediaRecentUpload extends MediaItem {
  bytes: number;
  uploadedAt: string;
}

export interface MediaOverview {
  files: MediaItem[];
  totalBytes: number;
  recentUploads: MediaRecentUpload[];
  limits: MediaPlanLimits | null;
}

/* -------------------------------------------------------------------------- */
/*  List                                                                      */
/* -------------------------------------------------------------------------- */

export async function listMedia(shop: string): Promise<MediaItem[]> {
  await ensureAuthorized();

  try {
    const entries = await readMediaEntries(shop);
    return entries.map(({ item }) => item);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }

    console.error("Failed to list media", err);
    throw new Error("Failed to list media");
  }
}

export async function getMediaOverview(shop: string): Promise<MediaOverview> {
  await ensureAuthorized();

  try {
    const entries = await readMediaEntries(shop);
    const files = entries.map(({ item }) => item);
    const totalBytes = entries.reduce((sum, entry) => sum + entry.size, 0);

    const recentUploads: MediaRecentUpload[] = entries
      .map(({ item, size, mtime }) => ({
        ...item,
        bytes: size,
        uploadedAt: mtime.toISOString(),
      }))
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() -
          new Date(a.uploadedAt).getTime()
      )
      .slice(0, 5);

    return {
      files,
      totalBytes,
      recentUploads,
      limits: null,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return {
        files: [],
        totalBytes: 0,
        recentUploads: [],
        limits: null,
      };
    }

    console.error("Failed to load media overview", err);
    throw new Error("Failed to load media overview");
  }
}

/* -------------------------------------------------------------------------- */
/*  Upload                                                                    */
/* -------------------------------------------------------------------------- */

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

  const dir = uploadsDir(shop);
  await fs.mkdir(dir, { recursive: true });

  const ext =
    path.extname(file.name) || (type === "video" ? ".mp4" : ".jpg");
  const filename = `${ulid()}${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);

  const meta = await readMetadata(shop);
  meta[filename] = { title, altText, type };
  await writeMetadata(shop, meta);

  return {
    url: path.posix.join("/uploads", shop, filename),
    title,
    altText,
    type,
  };
}

/* -------------------------------------------------------------------------- */
/*  Delete                                                                    */
/* -------------------------------------------------------------------------- */

export async function deleteMedia(
  shop: string,
  filePath: string
): Promise<void> {
  const prefix = path.posix.join("/uploads", validateShopName(shop)) + "/";
  const normalized = path.posix.normalize(filePath);

  if (!normalized.startsWith(prefix)) throw new Error("Invalid file path");

  const filename = normalized.slice(prefix.length);
  const dir = uploadsDir(shop);
  const fullPath = path.join(dir, filename);

  const relative = path.relative(dir, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file path");
  }

  await fs.unlink(fullPath).catch(() => {
    /* ignore – file might already be gone */
  });

  const meta = await readMetadata(shop);
  if (meta[filename]) {
    delete meta[filename];
    await writeMetadata(shop, meta);
  }
}
