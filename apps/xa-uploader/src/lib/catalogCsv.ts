/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] uploader CSV utilities pending security/i18n cleanup */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type { CatalogProductDraftInput } from "./catalogAdminSchema";
import { XA_PRODUCTS_CSV_MUTABLE_COLUMNS } from "./catalogCsvColumns";
import { buildCsvHeader, readCsvFile, writeCsvFileAtomically, type XaProductsCsvRow } from "./catalogCsvFormat";
import { buildCsvRowUpdateFromDraft, rowToDraftInput } from "./catalogCsvMapping";
import { slugify } from "./catalogAdminSchema";
import { resolveCatalogProductsCsvPath } from "./catalogStorefront.server";
import type { XaCatalogStorefront } from "./catalogStorefront.types";

export class CatalogCsvConflictError extends Error {
  override name = "CatalogCsvConflictError";
}

export function resolveXaUploaderProductsCsvPath(
  storefront?: XaCatalogStorefront,
): string {
  return resolveCatalogProductsCsvPath(storefront);
}

async function readProductsCsv(csvPath: string): Promise<{ header: string[]; rows: XaProductsCsvRow[] }> {
  try {
    return await readCsvFile(csvPath);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error?.code === "ENOENT") return { header: buildCsvHeader([]), rows: [] };
    throw err;
  }
}

function computeRowRevision(header: string[], row: XaProductsCsvRow): string {
  const payload = header.map((key) => `${key}=${row[key] ?? ""}`).join("\n");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function listCatalogDrafts(storefront?: XaCatalogStorefront): Promise<{
  path: string;
  products: CatalogProductDraftInput[];
  revisionsById: Record<string, string>;
}> {
  const csvPath = resolveXaUploaderProductsCsvPath(storefront);
  const { header, rows } = await readProductsCsv(csvPath);
  const revisionHeader = buildCsvHeader(header);
  const revisionsById: Record<string, string> = {};
  for (const row of rows) {
    const id = (row.id ?? "").trim();
    if (!id) continue;
    revisionsById[id] = computeRowRevision(revisionHeader, row);
  }
  return { path: csvPath, products: rows.map(rowToDraftInput), revisionsById };
}

export async function getCatalogDraftBySlug(
  slug: string,
  storefront?: XaCatalogStorefront,
): Promise<CatalogProductDraftInput | null> {
  const csvPath = resolveXaUploaderProductsCsvPath(storefront);
  const { rows } = await readProductsCsv(csvPath);
  const normalized = slugify(slug);
  const found = rows.find((row) => slugify(row.slug) === normalized);
  return found ? rowToDraftInput(found) : null;
}

export async function upsertCatalogDraft(
  input: CatalogProductDraftInput,
  options?: { ifMatch?: string; storefront?: XaCatalogStorefront },
): Promise<{ path: string; product: CatalogProductDraftInput; revision: string }> {
  const csvPath = resolveXaUploaderProductsCsvPath(options?.storefront);
  const update = buildCsvRowUpdateFromDraft(input);

  const { header, rows } = await readProductsCsv(csvPath);
  const normalizedSlug = slugify(update.slug);
  const normalizedId = (update.id ?? "").trim();
  const nextHeader = buildCsvHeader(header);
  const existingIndexById = normalizedId ? rows.findIndex((row) => row.id === normalizedId) : -1;
  const existingIndexBySlug = rows.findIndex((row) => slugify(row.slug) === normalizedSlug);
  if (existingIndexById >= 0 && existingIndexBySlug >= 0 && existingIndexById !== existingIndexBySlug) {
    throw new Error(`Product id "${normalizedId}" is already used by a different slug.`);
  }

  const existingIndex = existingIndexById >= 0 ? existingIndexById : existingIndexBySlug;

  const base = existingIndex >= 0 ? rows[existingIndex] : {};
  const nextRow: XaProductsCsvRow = { ...base };
  if (existingIndex >= 0 && options?.ifMatch) {
    const current = computeRowRevision(nextHeader, base);
    const expected = String(options.ifMatch).trim();
    if (expected && current !== expected) {
      throw new CatalogCsvConflictError(
        "This product was updated by someone else. Refresh and try again.",
      );
    }
  }
  for (const [key, value] of Object.entries(update)) {
    if (!XA_PRODUCTS_CSV_MUTABLE_COLUMNS.has(key)) continue;
    if (key === "id" && !value && nextRow.id) continue;
    nextRow[key] = value;
  }
  if (!nextRow.id) nextRow.id = crypto.randomUUID();

  const duplicates = rows.findIndex(
    (row, idx) => idx !== existingIndex && slugify(row.slug) === normalizedSlug,
  );
  if (duplicates >= 0) {
    throw new Error(`Duplicate product slug "${update.slug}".`);
  }

  if (existingIndex >= 0) {
    rows[existingIndex] = nextRow;
  } else {
    rows.push(nextRow);
  }

  await fs.mkdir(path.dirname(csvPath), { recursive: true });
  await writeCsvFileAtomically(csvPath, nextHeader, rows);

  return {
    path: csvPath,
    product: rowToDraftInput(nextRow),
    revision: computeRowRevision(nextHeader, nextRow),
  };
}

export async function deleteCatalogProduct(
  slug: string,
  storefront?: XaCatalogStorefront,
): Promise<{ path: string; deleted: boolean }> {
  const csvPath = resolveXaUploaderProductsCsvPath(storefront);
  const { header, rows } = await readProductsCsv(csvPath);
  const normalized = slugify(slug);
  const nextRows = rows.filter((row) => slugify(row.slug) !== normalized);
  const deleted = nextRows.length !== rows.length;
  if (!deleted) return { path: csvPath, deleted: false };

  const nextHeader = buildCsvHeader(header);
  await writeCsvFileAtomically(csvPath, nextHeader, nextRows);
  return { path: csvPath, deleted: true };
}
