"use server";

import { validateShopName } from "@platform-core/shops";
import { promises as fs } from "fs";
import * as path from "path";

import { ensureAuthorized } from "../common/auth";
import { readMetadata, uploadsDir, writeMetadata } from "../media.helpers";

export async function deleteMedia(shop: string, filePath: string): Promise<void> {
  await ensureAuthorized();

  const safeShop = validateShopName(shop);
  const prefix = path.posix.join("/uploads", safeShop) + "/";
  const normalized = path.posix.normalize(filePath);

  if (!normalized.startsWith(prefix)) throw new Error("Invalid file path");

  const filename = normalized.slice(prefix.length);
  const dir = uploadsDir(safeShop);
  const fullPath = path.join(dir, filename);

  const relative = path.relative(dir, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file path");
  }

  await fs.unlink(fullPath).catch(() => {
    /* ignore – file might already be gone */
  });

  const meta = await readMetadata(safeShop);
  if (meta[filename]) {
    delete meta[filename];
    await writeMetadata(safeShop, meta);
  }
}
