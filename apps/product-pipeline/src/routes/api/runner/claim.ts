/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/runner/claim.ts

import { z } from "zod";

import type { RunnerJob, StageMJobInput } from "@/lib/pipeline/runner-contract";

import { getDb, nowIso, type PipelineEnv, type StageRunRow } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";
import type { D1PreparedStatement, PipelineEventContext } from "../_lib/types";

const bodySchema = z.object({
  runnerId: z.string().min(1),
  stage: z.enum(["M"]).optional(),
  limit: z.number().int().min(1).max(10).optional(),
  captureMode: z.enum(["queue", "runner"]).optional(),
});

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export const onRequestPost = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const { stage, limit, runnerId, captureMode } = parsed.data;
  const db = getDb(env);
  const effectiveStage = stage ?? "M";
  const take = limit ?? 1;
  const now = nowIso();

  const fetchLimit = Math.max(take * 5, take);
  const rows = await db
    .prepare(
      "SELECT id, candidate_id, stage, status, input_json, created_at, started_at, finished_at, output_json, error_json FROM stage_runs WHERE stage = ? AND status = ? ORDER BY created_at ASC LIMIT ?",
    )
    .bind(effectiveStage, "queued", fetchLimit)
    .all<StageRunRow>();

  const jobs: RunnerJob[] = [];
  const candidateUpdates: D1PreparedStatement[] = [];

  for (const row of rows.results ?? []) {
    if (jobs.length >= take) break;
    if (!row.candidate_id) continue;
    const input = safeJsonParse<StageMJobInput>(row.input_json);
    if (!input || typeof input.kind !== "string") continue;
    if (captureMode) {
      const inputMode = input.captureMode ?? "queue";
      if (inputMode !== captureMode) continue;
    }

    const update = await db
      .prepare(
        "UPDATE stage_runs SET status = ?, started_at = ? WHERE id = ? AND status = ?",
      )
      .bind("running", now, row.id, "queued")
      .run();

    const changes = update.meta?.changes;
    if (changes !== 1) {
      const confirm = await db
        .prepare("SELECT status FROM stage_runs WHERE id = ?")
        .bind(row.id)
        .first<{ status: string }>();
      if (confirm?.status !== "running") continue;
    }

    candidateUpdates.push(
      db
        .prepare("UPDATE candidates SET stage_status = ?, updated_at = ? WHERE id = ?")
        .bind("M_RUNNING", now, row.candidate_id),
    );

    jobs.push({
      id: row.id,
      stage: "M",
      status: "running",
      candidateId: row.candidate_id,
      input,
      createdAt: row.created_at ?? now,
      startedAt: now,
    });
  }

  if (candidateUpdates.length > 0) {
    await db.batch(candidateUpdates);
  }

  return jsonResponse({ ok: true, runnerId, jobs });
};
