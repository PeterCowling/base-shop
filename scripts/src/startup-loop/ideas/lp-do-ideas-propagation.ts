import { createHash } from "node:crypto";

import type { RegistryV2ArtifactEntry } from "./lp-do-ideas-registry-migrate-v1-v2.js";

export type PropagationWriteTag =
  | "projection_auto"
  | "source_task"
  | "source_mechanical_auto";

export interface ProjectionUpdateOperation {
  kind: "projection_update";
  updated_by_process: "projection_auto";
  source_artifact_id: string;
  source_after_sha: string;
  target_artifact_id: string;
}

export interface StandingUpdateTaskOperation {
  kind: "standing_update_task";
  updated_by_process: "source_task";
  source_artifact_id: string;
  source_after_sha: string;
  target_artifact_id: string;
  task_id: string;
  idempotency_key: string;
}

export interface MechanicalUpdateOperation {
  kind: "mechanical_update";
  updated_by_process: "source_mechanical_auto";
  source_artifact_id: string;
  source_after_sha: string;
  target_artifact_id: string;
  operation_id: string;
}

export type PropagationOperation =
  | ProjectionUpdateOperation
  | StandingUpdateTaskOperation
  | MechanicalUpdateOperation;

export interface MechanicalUpdateAttempt {
  operation_id: string;
  target_artifact_id: string;
  before_truth_fingerprint: string;
  after_truth_fingerprint: string;
}

export interface RejectedMechanicalUpdate {
  operation_id: string;
  target_artifact_id: string;
  reason: "operation_not_allowlisted" | "semantic_fingerprint_changed";
}

export interface PropagationPlanInput {
  sourceArtifact: RegistryV2ArtifactEntry;
  sourceAfterSha: string;
  allowlistedMechanicalOperations?: readonly string[];
  mechanicalAttempts?: readonly MechanicalUpdateAttempt[];
}

export interface PropagationPlanResult {
  ok: boolean;
  mode: RegistryV2ArtifactEntry["propagation_mode"];
  operations: PropagationOperation[];
  rejected: RejectedMechanicalUpdate[];
  warnings: string[];
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

function normalizeId(value: string): string {
  return value.trim().toUpperCase();
}

function sanitizeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function dedupeSorted(values: readonly string[]): string[] {
  return [...new Set(values.map(normalizeId).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function buildSourceTaskIdempotencyKey(input: {
  source_artifact_id: string;
  source_after_sha: string;
  target_artifact_id: string;
}): string {
  const canonical = [
    normalizeId(input.source_artifact_id),
    input.source_after_sha.trim(),
    normalizeId(input.target_artifact_id),
    "source_task",
  ].join(":");
  return sha256(canonical);
}

function buildProjectionOperations(input: PropagationPlanInput): ProjectionUpdateOperation[] {
  const sourceArtifactId = normalizeId(input.sourceArtifact.artifact_id);
  const targets = dedupeSorted(input.sourceArtifact.produces ?? []);

  return targets.map((targetArtifactId) => ({
    kind: "projection_update",
    updated_by_process: "projection_auto",
    source_artifact_id: sourceArtifactId,
    source_after_sha: input.sourceAfterSha.trim(),
    target_artifact_id: targetArtifactId,
  }));
}

function buildSourceTaskOperations(input: PropagationPlanInput): StandingUpdateTaskOperation[] {
  const sourceArtifactId = normalizeId(input.sourceArtifact.artifact_id);
  const targets = dedupeSorted(input.sourceArtifact.produces ?? []);

  return targets.map((targetArtifactId) => {
    const idempotencyKey = buildSourceTaskIdempotencyKey({
      source_artifact_id: sourceArtifactId,
      source_after_sha: input.sourceAfterSha.trim(),
      target_artifact_id: targetArtifactId,
    });

    return {
      kind: "standing_update_task",
      updated_by_process: "source_task",
      source_artifact_id: sourceArtifactId,
      source_after_sha: input.sourceAfterSha.trim(),
      target_artifact_id: targetArtifactId,
      task_id: `standing-update:${sanitizeId(sourceArtifactId)}:${sanitizeId(targetArtifactId)}`,
      idempotency_key: idempotencyKey,
    };
  });
}

function buildMechanicalOperations(input: PropagationPlanInput): {
  operations: MechanicalUpdateOperation[];
  rejected: RejectedMechanicalUpdate[];
} {
  const sourceArtifactId = normalizeId(input.sourceArtifact.artifact_id);
  const allowlist = new Set(
    (input.allowlistedMechanicalOperations ?? []).map((operation) =>
      operation.trim().toLowerCase(),
    ),
  );

  const operations: MechanicalUpdateOperation[] = [];
  const rejected: RejectedMechanicalUpdate[] = [];

  for (const attempt of input.mechanicalAttempts ?? []) {
    const operationId = attempt.operation_id.trim().toLowerCase();
    const targetArtifactId = normalizeId(attempt.target_artifact_id);

    if (!allowlist.has(operationId)) {
      rejected.push({
        operation_id: attempt.operation_id,
        target_artifact_id: targetArtifactId,
        reason: "operation_not_allowlisted",
      });
      continue;
    }

    if (
      attempt.before_truth_fingerprint.trim() !==
      attempt.after_truth_fingerprint.trim()
    ) {
      rejected.push({
        operation_id: attempt.operation_id,
        target_artifact_id: targetArtifactId,
        reason: "semantic_fingerprint_changed",
      });
      continue;
    }

    operations.push({
      kind: "mechanical_update",
      updated_by_process: "source_mechanical_auto",
      source_artifact_id: sourceArtifactId,
      source_after_sha: input.sourceAfterSha.trim(),
      target_artifact_id: targetArtifactId,
      operation_id: operationId,
    });
  }

  return { operations, rejected };
}

export function buildPropagationPlan(
  input: PropagationPlanInput,
): PropagationPlanResult {
  const mode = input.sourceArtifact.propagation_mode;
  const warnings: string[] = [];

  if (!input.sourceAfterSha.trim()) {
    return {
      ok: false,
      mode,
      operations: [],
      rejected: [],
      warnings: ["sourceAfterSha is required"],
    };
  }

  if (mode === "projection_auto") {
    const operations = buildProjectionOperations(input);
    return {
      ok: true,
      mode,
      operations,
      rejected: [],
      warnings,
    };
  }

  if (mode === "source_task") {
    const operations = buildSourceTaskOperations(input);
    return {
      ok: true,
      mode,
      operations,
      rejected: [],
      warnings,
    };
  }

  const mechanical = buildMechanicalOperations(input);
  if (mechanical.rejected.length > 0) {
    warnings.push(
      `[lp-do-ideas-propagation] rejected ${mechanical.rejected.length} source_mechanical_auto attempt(s).`,
    );
  }

  return {
    ok: mechanical.rejected.length === 0,
    mode,
    operations: mechanical.operations,
    rejected: mechanical.rejected,
    warnings,
  };
}
