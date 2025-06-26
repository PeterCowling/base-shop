"use server";
import { authOptions } from "@cms/auth/options";
import { validateShopName } from "@platform-core/shops";
import type { ImageOrientation, MediaItem } from "@types";
import { getServerSession } from "next-auth";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import sharp from "sharp";
import { ulid } from "ulid";

async function ensureAuthorized(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "viewer") {
    throw new Error("Forbidden");
  }
}

/** Directory under public/ where uploads are stored per shop */
function uploadsDir(shop: string): string {
  shop = validateShopName(shop);
  return path.join(process.cwd(), "public", "uploads", shop);
}

function metadataPath(shop: string): string {
  return path.join(uploadsDir(shop), "metadata.json");
}

async function readMetadata(
  shop: string
): Promise<Record<string, { title?: string; altText?: string }>> {
  try {
    const data = await fs.readFile(metadataPath(shop), "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeMetadata(
  shop: string,
  data: Record<string, { title?: string; altText?: string }>
): Promise<void> {
  await fs.writeFile(metadataPath(shop), JSON.stringify(data, null, 2));
}

/** Return list of uploaded file URLs for a shop */
export async function listMedia(shop: string): Promise<MediaItem[]> {
  await ensureAuthorized();

  try {
    const dir = uploadsDir(shop);
    const files = await fs.readdir(dir);
    const meta = await readMetadata(shop);
    return files
      .filter((f) => f !== "metadata.json")
      .map((f) => ({
        url: path.posix.join("/uploads", shop, f),
        title: meta[f]?.title,
        altText: meta[f]?.altText,
      }));
  } catch {
    return [];
  }
}

/** Save uploaded file and return its public URL */
export async function uploadMedia(
  shop: string,
  formData: FormData,
  requiredOrientation: ImageOrientation = "landscape"
): Promise<MediaItem> {
  await ensureAuthorized();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }

  const title = formData.get("title")?.toString();
  const altText = formData.get("altText")?.toString();

  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type");
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    throw new Error("File too large");
  }

  const arrayBuffer = await new Response(file).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const { width, height } = await sharp(buffer).metadata();
    const orientation: ImageOrientation =
      width && height && width >= height ? "landscape" : "portrait";
    if (orientation !== requiredOrientation) {
      throw new Error(`Image orientation must be ${requiredOrientation}`);
    }
  } catch {
    throw new Error("Failed to process image");
  }

  const dir = uploadsDir(shop);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(file.name);
  const filename = `${ulid()}${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);

  const meta = await readMetadata(shop);
  meta[filename] = { title, altText };
  await writeMetadata(shop, meta);

  return {
    url: path.posix.join("/uploads", shop, filename),
    title,
    altText,
  };
}

/** Delete an uploaded file */
export async function deleteMedia(
  shop: string,
  filePath: string
): Promise<void> {
  const prefix = path.posix.join("/uploads", validateShopName(shop)) + "/";
  const normalized = path.posix.normalize(filePath);
  if (!normalized.startsWith(prefix)) {
    throw new Error("Invalid file path");
  }

  const filename = normalized.slice(prefix.length);
  const dir = uploadsDir(shop);
  const fullPath = path.join(dir, filename);

  const relative = path.relative(dir, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file path");
  }

  await fs.unlink(fullPath);

  const meta = await readMetadata(shop);
  if (meta[filename]) {
    delete meta[filename];
    await writeMetadata(shop, meta);
  }
}
