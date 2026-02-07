/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/runner/status.ts

import { getDb, type PipelineEnv } from "../_lib/db";
import { jsonResponse } from "../_lib/response";
import type { PipelineEventContext } from "../_lib/types";

const STALE_AFTER_MS = 5 * 60 * 1000;

type RunnerStatusRow = {
  entity_id: string;
  details_json: string | null;
  created_at: string | null;
};

function safeJsonParse(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

function parseTimestamp(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const url = new URL(request.url);
  const runnerId = url.searchParams.get("runnerId");
  const db = getDb(env);

  const baseQuery =
    "SELECT entity_id, details_json, created_at FROM audit_logs WHERE entity_type = ? AND action = ?";
  const query = runnerId
    ? `${baseQuery} AND entity_id = ? ORDER BY created_at DESC LIMIT 1`
    : `${baseQuery} ORDER BY created_at DESC LIMIT 1`;

  const row = runnerId
    ? await db
        .prepare(query)
        .bind("runner", "runner.heartbeat", runnerId)
        .first<RunnerStatusRow>()
    : await db
        .prepare(query)
        .bind("runner", "runner.heartbeat")
        .first<RunnerStatusRow>();

  if (!row) {
    return jsonResponse({ ok: true, runner: null });
  }

  const lastSeen = row.created_at ?? null;
  const lastSeenTs = parseTimestamp(lastSeen);
  const stale = lastSeenTs === null ? true : Date.now() - lastSeenTs > STALE_AFTER_MS;
  const details = safeJsonParse(row.details_json);

  return jsonResponse({
    ok: true,
    runner: {
      runnerId: row.entity_id,
      lastSeen,
      stale,
      ...details,
    },
  });
};
