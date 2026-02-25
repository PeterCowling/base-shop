import fs from "node:fs/promises";
import path from "node:path";

import { toWholeCount } from "@acme/lib";
import { readCsvFile, splitList, type XaProductsCsvRow } from "@acme/lib/xa";

type ErrnoLike = NodeJS.ErrnoException & { code?: string };

export type LoadedCatalogRows = {
  header: string[];
  rows: XaProductsCsvRow[];
  missing: boolean;
};

export function isErrnoCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as ErrnoLike).code === code;
}

export async function loadCatalogRows(productsPath: string): Promise<LoadedCatalogRows> {
  const exists = await fs
    .stat(productsPath)
    .then(() => true)
    .catch((error) => {
      if (isErrnoCode(error, "ENOENT")) return false;
      throw error;
    });
  if (!exists) {
    return { header: [], rows: [], missing: true };
  }

  const { header, rows } = await readCsvFile(productsPath);
  return { header, rows, missing: false };
}

export function parseList(value: string | undefined): string[] {
  return splitList(value ?? "");
}

export function toNonNegativeInt(value: number | undefined, fallback = 0): number {
  const rounded = toWholeCount(value);
  if (rounded === null) return fallback;
  return Math.max(0, rounded);
}

export function handleToTitle(handle: string): string {
  return handle
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function sanitizePathSegment(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

export function buildCatalogMediaPath(args: {
  brandHandle: string;
  productSlug: string;
  sourcePath: string;
  usedNames: Set<string>;
}): string {
  const extension = path.extname(args.sourcePath).toLowerCase() || ".jpg";
  const baseName = path.basename(args.sourcePath, extension);
  const safeBase = sanitizePathSegment(baseName, "image");
  let fileName = `${safeBase}${extension}`;
  let index = 2;
  while (args.usedNames.has(fileName)) {
    fileName = `${safeBase}-${index}${extension}`;
    index += 1;
  }
  args.usedNames.add(fileName);
  return path.posix.join(
    "/images",
    sanitizePathSegment(args.brandHandle, "brand"),
    sanitizePathSegment(args.productSlug, "product"),
    fileName,
  );
}

export async function writeJsonFile(filePath: string, payload: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(`${filePath}.tmp`, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.rename(`${filePath}.tmp`, filePath);
}

export async function backupFileIfExists(filePath: string, backupDir: string): Promise<string | null> {
  const exists = await fs
    .stat(filePath)
    .then(() => true)
    .catch((error) => {
      if (isErrnoCode(error, "ENOENT")) return false;
      throw error;
    });
  if (!exists) return null;
  await fs.mkdir(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.bak`);
  await fs.copyFile(filePath, backupPath);
  return backupPath;
}
