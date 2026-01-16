import { createReadStream } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

import dotenv from "dotenv";
import { parseFile } from "fast-csv";

export const CSV_ROW_NUMBER = Symbol("csvRowNumber");
export type CsvRow = Record<string, string> & { [CSV_ROW_NUMBER]?: number };
export type MediaItem = { type: "image"; path: string; altText?: string };

export function normalizeRow(row: Record<string, unknown>): CsvRow {
  const out: CsvRow = {};
  for (const [key, value] of Object.entries(row)) {
    const normalized = key.trim().toLowerCase();
    const raw = typeof value === "string" ? value : value == null ? "" : String(value);
    out[normalized] = raw.trim();
  }
  return out;
}

export function getRowNumber(row: CsvRow): number | undefined {
  return row[CSV_ROW_NUMBER];
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function loadEnvFile(envFilePath: string | undefined): boolean {
  if (!envFilePath) return false;
  dotenv.config({ path: envFilePath });
  return true;
}

export async function sha256File(filePath: string): Promise<string> {
  const hasher = createHash("sha256");
  const stream = createReadStream(filePath);
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk) => hasher.update(chunk));
    stream.on("end", () => resolve());
    stream.on("error", reject);
  });
  return hasher.digest("hex");
}

export function pick(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value) return value;
  }
  return "";
}

export function parseNumber(raw: string, field: string, fallback?: number): number {
  const trimmed = raw.trim();
  if (trimmed === "") {
    if (fallback === undefined) {
      throw new Error(`Missing required number for ${field}`);
    }
    return fallback;
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${field}: "${raw}"`);
  }
  return n;
}

export function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function parseBool(raw: string, fallback: boolean): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return fallback;
  const normalized = trimmed.toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return fallback;
}

export function parseList(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: "${raw}"`);
  }
  return date.toISOString();
}

export function slugify(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function titleCase(handle: string): string {
  const words = handle.split(/[-_]/g).filter(Boolean);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export async function readCsv(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    let idx = 0;
    parseFile(filePath, { headers: true, ignoreEmpty: true, trim: true })
      .on("error", (err) => reject(err))
      .on("data", (row: Record<string, unknown>) => {
        const normalized = normalizeRow(row);
        normalized[CSV_ROW_NUMBER] = idx + 2;
        idx += 1;
        rows.push(normalized);
      })
      .on("end", () => resolve(rows));
  });
}

export async function loadMediaMap(mediaPath: string): Promise<Record<string, MediaItem[]>> {
  const ext = path.extname(mediaPath).toLowerCase();
  if (ext === ".json") {
    const raw = await readFile(mediaPath, "utf8");
    const parsed = JSON.parse(raw) as {
      mediaByProduct?: Record<string, MediaItem[]>;
    };
    if (!parsed?.mediaByProduct) {
      throw new Error("Media JSON must include a mediaByProduct object.");
    }
    const normalized: Record<string, MediaItem[]> = {};
    for (const [slug, items] of Object.entries(parsed.mediaByProduct)) {
      normalized[slug] = (items ?? [])
        .filter((item) => Boolean(item?.path))
        .map((item) => ({
          type: "image",
          path: item.path,
          altText: item.altText,
        }));
    }
    return normalized;
  }

  if (ext === ".csv") {
    const rows = await readCsv(mediaPath);
    const mediaByProduct: Record<string, Array<MediaItem & { position?: number }>> = {};
    rows.forEach((row, idx) => {
      const productSlug = pick(row, ["product_slug", "slug", "product"]);
      const mediaPathValue = pick(row, ["path", "media_path", "image_id"]);
      if (!productSlug || !mediaPathValue) return;
      const position = parseOptionalNumber(pick(row, ["position", "order", "index"]));
      const altText = pick(row, ["alt_text", "alt", "alttext"]);
      const item: MediaItem & { position?: number } = {
        type: "image",
        path: mediaPathValue,
        altText: altText || undefined,
        position: Number.isFinite(position) ? position : idx,
      };
      mediaByProduct[productSlug] ||= [];
      mediaByProduct[productSlug].push(item);
    });

    const normalized: Record<string, MediaItem[]> = {};
    for (const [slug, items] of Object.entries(mediaByProduct)) {
      normalized[slug] = items
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map(({ position, ...item }) => item);
    }
    return normalized;
  }

  throw new Error(`Unsupported media file extension: ${ext}`);
}
