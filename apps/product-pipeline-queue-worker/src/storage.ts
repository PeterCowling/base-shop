/* i18n-exempt file -- PP-1100 Stage M queue storage helpers [ttl=2026-06-30] */

import type {
  D1Database,
  D1PreparedStatement,
  R2Bucket,
  RunnerError,
  StageMOutput,
  StageRunRow,
  StoredArtifact,
} from "./types";

export function nowIso(): string {
  return new Date().toISOString();
}

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return safe || "artifact.bin";
}

export async function fetchStageRunById(
  db: D1Database,
  id: string,
): Promise<StageRunRow | null> {
  const result = await db
    .prepare(
      "SELECT id, candidate_id, stage, status, input_json, output_json, error_json, created_at, started_at, finished_at FROM stage_runs WHERE id = ?",
    )
    .bind(id)
    .first<StageRunRow>();
  return result ?? null;
}

export async function markStageRunRunning(
  db: D1Database,
  stageRun: StageRunRow,
  now: string,
): Promise<void> {
  const statements: D1PreparedStatement[] = [];
  if (stageRun.status === "queued") {
    statements.push(
      db
        .prepare("UPDATE stage_runs SET status = ?, started_at = ? WHERE id = ?")
        .bind("running", now, stageRun.id),
    );
  }
  if (stageRun.candidate_id) {
    statements.push(
      db
        .prepare("UPDATE candidates SET stage_status = ?, updated_at = ? WHERE id = ?")
        .bind("M_RUNNING", now, stageRun.candidate_id),
    );
  }
  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export type CompleteStageRunOptions = {
  db: D1Database;
  stageRun: StageRunRow;
  status: "succeeded" | "failed";
  output: StageMOutput | null;
  error: RunnerError | null;
  artifact: StoredArtifact | null;
  now: string;
};

export async function completeStageRun(opts: CompleteStageRunOptions): Promise<void> {
  const { db, stageRun, status, output, error, artifact, now } = opts;
  const outputJson = output ? JSON.stringify(output) : null;
  const errorJson = error ? JSON.stringify(error) : null;
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        "UPDATE stage_runs SET status = ?, output_json = ?, error_json = ?, finished_at = ? WHERE id = ?",
      )
      .bind(status, outputJson, errorJson, now, stageRun.id),
  ];

  if (stageRun.candidate_id) {
    const candidateStatus = status === "succeeded" ? "M_DONE" : "M_FAILED";
    statements.push(
      db
        .prepare("UPDATE candidates SET stage_status = ?, updated_at = ? WHERE id = ?")
        .bind(candidateStatus, now, stageRun.candidate_id),
    );
  }

  if (artifact && stageRun.candidate_id) {
    statements.push(
      db
        .prepare(
          "INSERT INTO artifacts (id, candidate_id, stage_run_id, kind, uri, checksum, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          stageRun.candidate_id,
          stageRun.id,
          artifact.kind,
          artifact.uri,
          null,
          now,
        ),
    );
  }

  await db.batch(statements);
}

export async function storeHtmlArtifact(
  bucket: R2Bucket,
  candidateId: string,
  stageRunId: string,
  html: string,
  kind: string,
  now: string,
): Promise<StoredArtifact | null> {
  const safeKind = sanitizeFilename(kind);
  const filename = sanitizeFilename(`capture-${stageRunId}.html`);
  const timestamp = now.replace(/[:.]/g, "-");
  const key = `candidates/${candidateId}/stage-runs/${stageRunId}/${timestamp}-${safeKind}-${filename}`;

  await bucket.put(key, html, {
    httpMetadata: { contentType: "text/html" },
    customMetadata: {
      candidateId,
      stageRunId,
      kind,
    },
  });

  return {
    kind,
    uri: `r2://product-pipeline-evidence/${key}`,
  };
}
