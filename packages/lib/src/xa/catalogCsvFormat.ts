import fs from "node:fs/promises";

import { parseFile } from "fast-csv";

import { XA_PRODUCTS_CSV_COLUMN_ORDER } from "./catalogCsvColumns.js";

export type XaProductsCsvRow = Record<string, string>;
type ErrnoLike = NodeJS.ErrnoException & { code?: string };

export function normalizeCsvKey(key: string): string {
  return key.trim().toLowerCase();
}

export function normalizeCsvRow(row: Record<string, unknown>): XaProductsCsvRow {
  const out: XaProductsCsvRow = {};
  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeCsvKey(key);
    const raw =
      typeof value === "string" ? value : value == null ? "" : String(value);
    out[normalized] = raw.trim();
  }
  return out;
}

export function csvEscape(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, `""`)}"`;
}

export function parseBoolean(raw: string, fallback: boolean) {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const normalized = trimmed.toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return fallback;
}

function isRetryableCsvWriteError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as ErrnoLike).code;
  return code === "EPERM" || code === "EACCES" || code === "EBUSY";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readCsvFile(
  filePath: string,
): Promise<{ header: string[]; rows: XaProductsCsvRow[] }> {
  return await new Promise((resolve, reject) => {
    const rows: XaProductsCsvRow[] = [];
    let header: string[] = [];
    parseFile(filePath, { headers: true, ignoreEmpty: true, trim: true })
      .on("error", reject)
      .on("headers", (headers: string[]) => {
        header = headers.map(normalizeCsvKey);
      })
      .on("data", (row: Record<string, unknown>) => rows.push(normalizeCsvRow(row)))
      .on("end", () => resolve({ header, rows }));
  });
}

export function buildCsvHeader(existing: string[]): string[] {
  const present = new Set(existing.map(normalizeCsvKey));
  XA_PRODUCTS_CSV_COLUMN_ORDER.forEach((key) => present.add(key));
  const header: string[] = [];
  for (const key of XA_PRODUCTS_CSV_COLUMN_ORDER) {
    if (present.has(key)) header.push(key);
  }
  const rest = Array.from(present)
    .filter((key) => !header.includes(key))
    .sort((a, b) => a.localeCompare(b));
  header.push(...rest);
  return header;
}

export async function writeCsvFileAtomically(
  filePath: string,
  header: string[],
  rows: XaProductsCsvRow[],
): Promise<void> {
  const csvLineEnding = "\r\n";
  const tempPath = `${filePath}.tmp`;
  const body =
    `${header.join(",")}${csvLineEnding}` +
    rows
      .map((row) => header.map((key) => csvEscape(row[key] ?? "")).join(","))
      .join(csvLineEnding) +
    csvLineEnding;
  await fs.writeFile(tempPath, body, "utf8");

  const maxRenameAttempts = 4;
  for (let attempt = 0; attempt < maxRenameAttempts; attempt += 1) {
    try {
      await fs.rename(tempPath, filePath);
      return;
    } catch (error) {
      const isRetryable = isRetryableCsvWriteError(error);
      const isLastAttempt = attempt === maxRenameAttempts - 1;
      if (!isRetryable || isLastAttempt) {
        await fs.unlink(tempPath).catch(() => undefined);
        throw error;
      }
      await sleep(75 * (attempt + 1));
    }
  }
}
