/**
 * Single-writer manifest update mechanism (LPSP-03B).
 *
 * Reads stage-result files from a run directory, validates them,
 * and updates baseline.manifest.json when all required upstream
 * stages are Done. Rejects with structured error otherwise.
 *
 * This module enforces the control-plane single-writer contract:
 * only this entry point may write baseline.manifest.json.
 *
 * @see docs/business-os/startup-loop/manifest-schema.md
 * @see docs/business-os/startup-loop/stage-result-schema.md
 */

import { promises as fs } from "fs";
import path from "path";

// -- Types --

export interface StageResult {
  schema_version: number;
  run_id: string;
  stage: string;
  loop_spec_version: string;
  status: "Done" | "Failed" | "Blocked";
  timestamp: string;
  produced_keys: string[];
  artifacts: Record<string, string>;
  error: string | null;
  blocking_reason: string | null;
}

export interface BaselineManifest {
  schema_version: number;
  run_id: string;
  business: string;
  loop_spec_version: string;
  status: "candidate" | "current";
  created_at: string;
  updated_at: string;
  artifacts: Record<string, string>;
  stage_completions: Record<
    string,
    {
      status: "Done" | "Failed" | "Blocked";
      timestamp: string;
      produced_keys: string[];
    }
  >;
}

export interface ManifestUpdateSuccess {
  success: true;
  manifest: BaselineManifest;
}

export interface ManifestUpdateFailure {
  success: false;
  reason: string;
  missing_stages: string[];
  failed_stages: string[];
  blocked_stages: string[];
  malformed_stages: string[];
}

export type ManifestUpdateResult = ManifestUpdateSuccess | ManifestUpdateFailure;

export interface ManifestUpdateOptions {
  run_id: string;
  business: string;
  loop_spec_version: string;
}

// -- Constants --

/** Required stage results for S4 barrier merge (per loop-spec.yaml). */
const REQUIRED_STAGES = ["MARKET-06", "S3", "SELL-01"] as const;

const VALID_STATUSES = new Set(["Done", "Failed", "Blocked"]);

// -- Validation --

function validateStageResult(
  data: unknown,
  stage: string,
): StageResult | { validation_error: string } {
  if (typeof data !== "object" || data === null) {
    return { validation_error: `Stage ${stage}: not a valid JSON object` };
  }

  const obj = data as Record<string, unknown>;

  if (obj.schema_version !== 1) {
    return { validation_error: `Stage ${stage}: schema_version must be 1` };
  }

  if (typeof obj.stage !== "string" || obj.stage.length === 0) {
    return { validation_error: `Stage ${stage}: missing or empty stage field` };
  }

  if (typeof obj.status !== "string" || !VALID_STATUSES.has(obj.status)) {
    return {
      validation_error: `Stage ${stage}: status must be one of Done|Failed|Blocked`,
    };
  }

  if (obj.status === "Done") {
    if (!Array.isArray(obj.produced_keys) || obj.produced_keys.length === 0) {
      return {
        validation_error: `Stage ${stage}: status=Done requires non-empty produced_keys`,
      };
    }
    if (typeof obj.artifacts !== "object" || obj.artifacts === null) {
      return { validation_error: `Stage ${stage}: status=Done requires artifacts object` };
    }
    const artifactKeys = Object.keys(obj.artifacts as Record<string, unknown>);
    for (const key of obj.produced_keys as string[]) {
      if (!artifactKeys.includes(key)) {
        return {
          validation_error: `Stage ${stage}: produced_key "${key}" missing from artifacts`,
        };
      }
    }
  }

  if (obj.status === "Failed" && !obj.error) {
    return { validation_error: `Stage ${stage}: status=Failed requires error field` };
  }

  if (obj.status === "Blocked" && !obj.blocking_reason) {
    return {
      validation_error: `Stage ${stage}: status=Blocked requires blocking_reason field`,
    };
  }

  return data as StageResult;
}

// -- Discovery --

async function discoverStageResults(
  runDir: string,
): Promise<Map<string, string>> {
  const stagesDir = path.join(runDir, "stages");
  const results = new Map<string, string>();

  let entries: string[];
  try {
    entries = await fs.readdir(stagesDir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const resultPath = path.join(stagesDir, entry, "stage-result.json");
    try {
      await fs.access(resultPath);
      results.set(entry, resultPath);
    } catch {
      // No stage-result.json in this directory — skip
    }
  }

  return results;
}

// -- Sort helper for deterministic output --

function sortKeys<T extends Record<string, unknown>>(obj: T): T {
  const sorted = {} as Record<string, unknown>;
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return sorted as T;
}

// -- Main entry point --

export async function updateManifest(
  runDir: string,
  options: ManifestUpdateOptions,
): Promise<ManifestUpdateResult> {
  const discovered = await discoverStageResults(runDir);

  const missing: string[] = [];
  const failed: string[] = [];
  const blocked: string[] = [];
  const malformed: string[] = [];
  const valid = new Map<string, StageResult>();

  // Validate all discovered stage results
  for (const [stage, filePath] of discovered) {
    let raw: string;
    try {
      raw = await fs.readFile(filePath, "utf-8");
    } catch {
      malformed.push(stage);
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      malformed.push(stage);
      continue;
    }

    const result = validateStageResult(parsed, stage);
    if ("validation_error" in result) {
      malformed.push(stage);
      continue;
    }

    valid.set(stage, result);
  }

  // Check required stages
  for (const required of REQUIRED_STAGES) {
    if (malformed.includes(required)) {
      continue; // Already flagged
    }
    if (!valid.has(required)) {
      missing.push(required);
      continue;
    }
    const result = valid.get(required)!;
    if (result.status === "Failed") {
      failed.push(required);
    } else if (result.status === "Blocked") {
      blocked.push(required);
    }
  }

  // Reject if any issues
  if (
    missing.length > 0 ||
    failed.length > 0 ||
    blocked.length > 0 ||
    malformed.length > 0
  ) {
    const reasons: string[] = [];
    if (missing.length > 0) {
      reasons.push(`Missing stage results: ${missing.join(", ")}`);
    }
    if (failed.length > 0) {
      reasons.push(`Failed stages: ${failed.join(", ")}`);
    }
    if (blocked.length > 0) {
      reasons.push(`Blocked stages: ${blocked.join(", ")}`);
    }
    if (malformed.length > 0) {
      reasons.push(`Malformed stage results: ${malformed.join(", ")}`);
    }

    return {
      success: false,
      reason: reasons.join("; "),
      missing_stages: missing,
      failed_stages: failed,
      blocked_stages: blocked,
      malformed_stages: malformed,
    };
  }

  // Collect artifacts from all Done stages (sorted for determinism)
  const artifacts: Record<string, string> = {};
  const stageCompletions: BaselineManifest["stage_completions"] = {};

  for (const [stage, result] of [...valid.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    // Stage completions for all valid results
    stageCompletions[stage] = {
      status: result.status,
      timestamp: result.timestamp,
      produced_keys: result.produced_keys,
    };

    // Artifacts only from Done stages
    if (result.status === "Done") {
      for (const key of [...result.produced_keys].sort()) {
        const artifactPath = result.artifacts[key];
        if (artifactPath) {
          artifacts[`${stage}/${key}`] = artifactPath;
        }
      }
    }
  }

  const now = new Date().toISOString();

  // Check if manifest already exists (for created_at preservation)
  let createdAt = now;
  const manifestPath = path.join(runDir, "baseline.manifest.json");
  try {
    const existing = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
    if (existing.created_at) {
      createdAt = existing.created_at;
    }
  } catch {
    // No existing manifest — use current time
  }

  const manifest: BaselineManifest = {
    schema_version: 1,
    run_id: options.run_id,
    business: options.business,
    loop_spec_version: options.loop_spec_version,
    status: "candidate",
    created_at: createdAt,
    updated_at: now,
    artifacts: sortKeys(artifacts),
    stage_completions: sortKeys(stageCompletions),
  };

  // Write manifest with sorted keys for deterministic output
  await fs.writeFile(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n",
  );

  return { success: true, manifest };
}
