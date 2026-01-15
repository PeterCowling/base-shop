import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { type Catalog } from "./xa-catalog-types";
import {
  type CsvRow,
  type MediaItem,
  fileExists,
  parseList,
  pick,
} from "./xa-utils";

export function requireValue(row: CsvRow, keys: string[], label: string, strict: boolean): string {
  const value = pick(row, keys);
  if (strict && !value) {
    throw new Error(`Missing required field "${label}".`);
  }
  return value;
}

export function buildMediaFromRow(row: CsvRow, fallbackAlt: string): MediaItem[] {
  const paths = parseList(pick(row, ["media_paths", "media", "images"]));
  if (!paths.length) return [];
  const altTexts = parseList(pick(row, ["media_alt_texts", "alt_texts", "alts"]));
  return paths.map((item, idx) => ({
    type: "image",
    path: item,
    altText: altTexts[idx] || fallbackAlt,
  }));
}

export async function loadExistingCatalog(baseCatalogPath: string): Promise<Catalog> {
  if (!(await fileExists(baseCatalogPath))) {
    return { collections: [], brands: [], products: [] };
  }
  const raw = await readFile(baseCatalogPath, "utf8");
  const parsed = JSON.parse(raw) as Catalog;
  if (!parsed?.products || !parsed?.brands || !parsed?.collections) {
    throw new Error(`Invalid catalog JSON at ${baseCatalogPath}`);
  }
  return {
    collections: Array.isArray(parsed.collections) ? parsed.collections : [],
    brands: Array.isArray(parsed.brands) ? parsed.brands : [],
    products: Array.isArray(parsed.products) ? parsed.products : [],
  };
}

export async function maybeBackupFile(
  targetPath: string,
  options: { enabled: boolean; backupDir?: string },
): Promise<string | null> {
  if (!options.enabled) return null;
  if (!(await fileExists(targetPath))) return null;
  const backupDir = options.backupDir ? path.resolve(options.backupDir) : path.dirname(targetPath);
  await mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `${path.basename(targetPath)}.bak.${stamp}`;
  const backupPath = path.join(backupDir, backupName);
  await copyFile(targetPath, backupPath);
  return backupPath;
}

