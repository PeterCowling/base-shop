/**
 * Baseline merge — S4 join barrier (LPSP-06B).
 *
 * Reads upstream stage-result files (S2B, S3, S6B), validates required
 * inputs, and composes a deterministic baseline snapshot.
 *
 * This is a data-plane stage worker. It writes ONLY to `stages/S4/`.
 * It does NOT write `baseline.manifest.json` (control-plane owned).
 *
 * @see .claude/skills/lp-baseline-merge/SKILL.md
 * @see docs/business-os/startup-loop/stage-result-schema.md
 */

import { promises as fs } from "fs";
import path from "path";

import type { StageResult } from "./manifest-update";

// -- Types --

export interface BaselineMergeOptions {
  run_id: string;
  business: string;
  loop_spec_version: string;
}

export interface BaselineMergeSuccess {
  success: true;
  stage_result: StageResult;
  snapshot_path: string;
}

export interface BaselineMergeFailure {
  success: false;
  stage_result: StageResult;
}

export type BaselineMergeResult = BaselineMergeSuccess | BaselineMergeFailure;

// -- Required inputs from loop-spec S4 --

interface RequiredInput {
  stage: string;
  artifact_key: string;
  label: string;
}

const REQUIRED_INPUTS: RequiredInput[] = [
  { stage: "S2B", artifact_key: "offer", label: "offer" },
  { stage: "S3", artifact_key: "forecast", label: "forecast" },
  { stage: "S6B", artifact_key: "channels", label: "channels" },
];

const OPTIONAL_INPUTS: RequiredInput[] = [
  { stage: "S6B", artifact_key: "seo", label: "SEO strategy" },
  { stage: "S6B", artifact_key: "outreach", label: "outreach plan" },
];

// -- Main --

export async function baselineMerge(
  runDir: string,
  options: BaselineMergeOptions,
): Promise<BaselineMergeResult> {
  const s4Dir = path.join(runDir, "stages", "S4");
  await fs.mkdir(s4Dir, { recursive: true });

  // 1. Discover and validate upstream stage results
  const stageResults = new Map<string, StageResult>();
  for (const stage of ["S2B", "S3", "S6B"]) {
    const resultPath = path.join(runDir, "stages", stage, "stage-result.json");
    try {
      const data = JSON.parse(await fs.readFile(resultPath, "utf-8"));
      stageResults.set(stage, data as StageResult);
    } catch {
      // Stage result not found — will be caught in validation below
    }
  }

  // 2. Check required inputs
  const blockingReasons: string[] = [];

  for (const input of REQUIRED_INPUTS) {
    const result = stageResults.get(input.stage);
    if (!result) {
      blockingReasons.push(
        `Required input missing: ${input.stage} stage-result.json not found (${input.artifact_key} artifact required)`,
      );
      continue;
    }

    if (result.status === "Failed") {
      blockingReasons.push(
        `Upstream failure: ${input.stage} status=Failed — ${input.label} failed`,
      );
      continue;
    }

    if (result.status === "Blocked") {
      blockingReasons.push(
        `Upstream blocked: ${input.stage} status=Blocked — ${input.label} blocked`,
      );
      continue;
    }

    if (!result.produced_keys.includes(input.artifact_key)) {
      blockingReasons.push(
        `Malformed input: ${input.stage} completed but ${input.artifact_key} artifact missing from produced_keys`,
      );
    }
  }

  if (blockingReasons.length > 0) {
    const stageResult = makeStageResult(options, "Blocked", blockingReasons.join("; "));
    await writeStageResult(s4Dir, stageResult);
    return { success: false, stage_result: stageResult };
  }

  // 3. Read upstream artifact files
  const artifacts: Record<string, string> = {};

  for (const input of [...REQUIRED_INPUTS, ...OPTIONAL_INPUTS]) {
    const result = stageResults.get(input.stage);
    if (!result) continue;

    const artifactPath = result.artifacts[input.artifact_key];
    if (!artifactPath) continue;

    try {
      artifacts[input.artifact_key] = await fs.readFile(
        path.join(runDir, artifactPath),
        "utf-8",
      );
    } catch {
      // For required inputs, this is an error. For optional, skip silently.
      if (REQUIRED_INPUTS.some((r) => r.artifact_key === input.artifact_key)) {
        const stageResult = makeStageResult(
          options,
          "Failed",
          null,
          `Artifact file missing: ${artifactPath} referenced in ${input.stage} stage-result`,
        );
        await writeStageResult(s4Dir, stageResult);
        return { success: false, stage_result: stageResult };
      }
    }
  }

  // 4. Compose baseline snapshot (use max upstream timestamp for determinism)
  const upstreamTimestamps = [...stageResults.values()].map((r) => r.timestamp);
  const latestTimestamp = upstreamTimestamps.sort().pop() ?? new Date().toISOString();
  const snapshot = composeSnapshot(options, artifacts, latestTimestamp);
  const snapshotPath = path.join(s4Dir, "baseline.snapshot.md");
  await fs.writeFile(snapshotPath, snapshot);

  // 5. Write success stage-result
  const stageResult: StageResult = {
    schema_version: 1,
    run_id: options.run_id,
    stage: "S4",
    loop_spec_version: options.loop_spec_version,
    status: "Done",
    timestamp: new Date().toISOString(),
    produced_keys: ["baseline_snapshot"],
    artifacts: { baseline_snapshot: "stages/S4/baseline.snapshot.md" },
    error: null,
    blocking_reason: null,
  };
  await writeStageResult(s4Dir, stageResult);

  return {
    success: true,
    stage_result: stageResult,
    snapshot_path: snapshotPath,
  };
}

// -- Helpers --

function composeSnapshot(
  options: BaselineMergeOptions,
  artifacts: Record<string, string>,
  generatedTimestamp: string,
): string {
  const placeholder = "Not produced in this run.";

  const sections = [
    `# Baseline Snapshot — ${options.business}`,
    "",
    `Run: ${options.run_id}`,
    `Generated: ${generatedTimestamp}`,
    `Loop spec version: ${options.loop_spec_version}`,
    "",
    "## 1. Offer Design (S2B)",
    "",
    artifacts.offer ?? placeholder,
    "",
    "## 2. Forecast (S3)",
    "",
    artifacts.forecast ?? placeholder,
    "",
    "## 3. Channel Strategy + GTM (S6B)",
    "",
    artifacts.channels ?? placeholder,
    "",
    "## 4. SEO Strategy (S6B, optional)",
    "",
    artifacts.seo ?? placeholder,
    "",
    "## 5. Outreach Plan (S6B, optional)",
    "",
    artifacts.outreach ?? placeholder,
    "",
    "---",
    "",
    "_This snapshot was generated by /lp-baseline-merge (S4). It is a candidate baseline",
    "pending review at S5A and commit at S5B._",
    "",
  ];

  return sections.join("\n");
}

function makeStageResult(
  options: BaselineMergeOptions,
  status: "Blocked" | "Failed",
  blockingReason?: string | null,
  error?: string | null,
): StageResult {
  return {
    schema_version: 1,
    run_id: options.run_id,
    stage: "S4",
    loop_spec_version: options.loop_spec_version,
    status,
    timestamp: new Date().toISOString(),
    produced_keys: [],
    artifacts: {},
    error: error ?? null,
    blocking_reason: blockingReason ?? null,
  };
}

async function writeStageResult(
  s4Dir: string,
  stageResult: StageResult,
): Promise<void> {
  await fs.writeFile(
    path.join(s4Dir, "stage-result.json"),
    JSON.stringify(stageResult, null, 2),
  );
}
