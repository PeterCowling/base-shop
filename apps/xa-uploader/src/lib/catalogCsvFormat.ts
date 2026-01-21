/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] uploader CSV format helpers pending security audit */

import fs from "node:fs/promises";

import { parseFile } from "fast-csv";

import { XA_PRODUCTS_CSV_COLUMN_ORDER } from "./catalogCsvColumns";

export type XaProductsCsvRow = Record<string, string>;

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
  const needsQuotes = /[",\n]/.test(value);
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
  const tempPath = `${filePath}.tmp`;
  const body =
    `${header.join(",")}\n` +
    rows
      .map((row) => header.map((key) => csvEscape(row[key] ?? "")).join(","))
      .join("\n") +
    "\n";
  await fs.writeFile(tempPath, body, "utf8");
  await fs.rename(tempPath, filePath);
}
