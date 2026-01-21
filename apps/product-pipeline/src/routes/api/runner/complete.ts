/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/runner/complete.ts

import { z } from "zod";

import { fetchStageRunById, getDb, nowIso, type PipelineEnv } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";
import type { D1PreparedStatement, PipelineEventContext } from "../_lib/types";

const errorSchema = z.object({
  message: z.string().min(1),
  code: z.string().min(1).optional(),
  details: z.unknown().optional(),
});

const artifactSchema = z.object({
  kind: z.string().min(1),
  uri: z.string().min(1),
  checksum: z.string().min(1).optional(),
});

const bodySchema = z
  .object({
    jobId: z.string().min(1),
    status: z.enum(["succeeded", "failed"]),
    output: z.unknown().optional(),
    error: errorSchema.optional(),
    artifacts: z.array(artifactSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "failed" && !data.error) {
      ctx.addIssue({ code: "custom", path: ["error"], message: "required" });
    }
  });

function extractCaptureMeta(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const meta = record["captureMeta"];
  if (meta && typeof meta === "object") {
    return meta as Record<string, unknown>;
  }
  return null;
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

  const { jobId, status, output, error, artifacts } = parsed.data;
  const db = getDb(env);
  const stageRun = await fetchStageRunById(db, jobId);
  if (!stageRun) {
    return errorResponse(404, "job_not_found", { jobId });
  }
  if (stageRun.status !== "running" && stageRun.status !== "queued") {
    return errorResponse(409, "job_not_active", { status: stageRun.status });
  }

  const now = nowIso();
  const outputJson = output === undefined ? null : JSON.stringify(output);
  const errorJson = error === undefined ? null : JSON.stringify(error);
  const captureMeta =
    extractCaptureMeta(output) ??
    extractCaptureMeta(error?.details ?? null);
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        "UPDATE stage_runs SET status = ?, output_json = ?, error_json = ?, finished_at = ? WHERE id = ?",
      )
      .bind(status, outputJson, errorJson, now, jobId),
  ];

  if (stageRun.candidate_id) {
    const candidateStatus = status === "succeeded" ? "M_DONE" : "M_FAILED";
    statements.push(
      db
        .prepare("UPDATE candidates SET stage_status = ?, updated_at = ? WHERE id = ?")
        .bind(candidateStatus, now, stageRun.candidate_id),
    );
  }

  for (const artifact of artifacts ?? []) {
    if (!stageRun.candidate_id) break;
    statements.push(
      db
        .prepare(
          "INSERT INTO artifacts (id, candidate_id, stage_run_id, kind, uri, checksum, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          stageRun.candidate_id,
          jobId,
          artifact.kind,
          artifact.uri,
          artifact.checksum ?? null,
          now,
        ),
    );
  }

  if (captureMeta) {
    statements.push(
      db
        .prepare(
          "INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          "stage_run",
          jobId,
          "stage_run.capture",
          JSON.stringify({
            candidateId: stageRun.candidate_id,
            stage: stageRun.stage,
            status,
            errorCode: error?.code ?? null,
            captureMeta,
          }),
          now,
        ),
    );
  }

  await db.batch(statements);

  return jsonResponse({
    ok: true,
    jobId,
    status,
  });
};
