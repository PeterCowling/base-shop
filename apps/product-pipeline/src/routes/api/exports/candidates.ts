/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/exports/candidates.ts

import { type CandidateRow, getDb, type PipelineEnv } from "../_lib/db";
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
  let str = String(value);
  // Prevent formula injection by prefixing dangerous characters with single quote
  // Excel/Google Sheets interpret =, +, -, @, \t, \r as formula starters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
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
            `SELECT id, lead_id, fingerprint, stage_status, decision, decision_reason, created_at, updated_at FROM candidates WHERE id IN (${ids
              .map(() => "?")
              .join(", ")}) ORDER BY created_at DESC`,
          )
          .bind(...ids)
          .all<CandidateRow>()
      : await db
          .prepare(
            "SELECT id, lead_id, fingerprint, stage_status, decision, decision_reason, created_at, updated_at FROM candidates ORDER BY created_at DESC LIMIT ? OFFSET ?",
          )
          .bind(limit, offset)
          .all<CandidateRow>();

  const headers = [
    "id",
    "lead_id",
    "fingerprint",
    "stage_status",
    "decision",
    "decision_reason",
    "created_at",
    "updated_at",
  ];

  const rows = (result.results ?? []).map((row) => ({
    id: row.id,
    lead_id: row.lead_id ?? "",
    fingerprint: row.fingerprint ?? "",
    stage_status: row.stage_status ?? "",
    decision: row.decision ?? "",
    decision_reason: row.decision_reason ?? "",
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
  }));

  const csv = buildCsv(headers, rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=candidates.csv",
    },
  });
};
