"use server";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { ulid } from "ulid";

/** Directory under public/ where uploads are stored per shop */
function uploadsDir(shop: string): string {
  return path.join(process.cwd(), "public", "uploads", shop);
}

/** Return list of uploaded file URLs for a shop */
export async function listMedia(shop: string): Promise<string[]> {
  try {
    const dir = uploadsDir(shop);
    const files = await fs.readdir(dir);
    return files.map((f) => path.posix.join("/uploads", shop, f));
  } catch {
    return [];
  }
}

/** Save uploaded file and return its public URL */
export async function uploadMedia(
  shop: string,
  formData: FormData
): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }

  const dir = uploadsDir(shop);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(file.name);
  const filename = `${ulid()}${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(path.join(dir, filename), Buffer.from(arrayBuffer));
  return path.posix.join("/uploads", shop, filename);
}
