/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/exports/leads.ts

import { getDb, type LeadRow, type PipelineEnv } from "../_lib/db";
import type { PipelineEventContext } from "../_lib/types";

function parseIntParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseIdsParam(value: string | null, max: number): string[] {
  if (!value) return [];
  const ids = value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return Array.from(new Set(ids)).slice(0, max);
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((header) => csvEscape(row[header]));
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const db = getDb(env);
  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 500, 1, 5000);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 50_000);
  const ids = parseIdsParam(url.searchParams.get("ids"), 5000);

  const result =
    ids.length > 0
      ? await db
          .prepare(
            `SELECT id, source, source_context, title, url, price_band, fingerprint, duplicate_of, status, triage_score, triage_band, triage_reasons, created_at, updated_at FROM leads WHERE id IN (${ids
              .map(() => "?")
              .join(", ")}) ORDER BY created_at DESC`,
          )
          .bind(...ids)
          .all<LeadRow>()
      : await db
          .prepare(
            "SELECT id, source, source_context, title, url, price_band, fingerprint, duplicate_of, status, triage_score, triage_band, triage_reasons, created_at, updated_at FROM leads ORDER BY created_at DESC LIMIT ? OFFSET ?",
          )
          .bind(limit, offset)
          .all<LeadRow>();

  const headers = [
    "id",
    "source",
    "source_context",
    "title",
    "url",
    "price_band",
    "fingerprint",
    "duplicate_of",
    "status",
    "triage_score",
    "triage_band",
    "triage_reasons",
    "created_at",
    "updated_at",
  ];

  const rows = (result.results ?? []).map((row) => ({
    id: row.id,
    source: row.source ?? "",
    source_context: row.source_context ?? "",
    title: row.title ?? "",
    url: row.url ?? "",
    price_band: row.price_band ?? "",
    fingerprint: row.fingerprint ?? "",
    duplicate_of: row.duplicate_of ?? "",
    status: row.status ?? "",
    triage_score: row.triage_score ?? "",
    triage_band: row.triage_band ?? "",
    triage_reasons: row.triage_reasons ?? "",
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
  }));

  const csv = buildCsv(headers, rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=leads.csv",
    },
  });
};
