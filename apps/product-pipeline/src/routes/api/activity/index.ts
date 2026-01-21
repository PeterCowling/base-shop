/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/activity/index.ts

import { getDb, type PipelineEnv } from "../_lib/db";
import { jsonResponse } from "../_lib/response";
import type { PipelineEventContext } from "../_lib/types";

type AuditLogRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  details_json: string | null;
  created_at: string | null;
};

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

function safeJsonParse(value: string | null): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const db = getDb(env);
  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 50, 1, 200);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 10_000);
  const entityType = url.searchParams.get("entity_type");

  const conditions: string[] = [];
  const binds: Array<string | number> = [];

  if (entityType) {
    conditions.push("entity_type = ?");
    binds.push(entityType);
  }

  let query =
    "SELECT id, entity_type, entity_id, action, details_json, created_at FROM audit_logs";
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  binds.push(limit, offset);

  const result = await db.prepare(query).bind(...binds).all<AuditLogRow>();
  const entries = (result.results ?? []).map((row) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    details: safeJsonParse(row.details_json),
    createdAt: row.created_at,
  }));

  return jsonResponse({ ok: true, entries, limit, offset });
};
