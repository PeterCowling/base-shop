/**
 * BOS sync — S5B idempotent persistence + manifest commit signal (LPSP-06C).
 *
 * Gates on S5A completion, persists cards/stage-docs via BOS Agent API,
 * and writes stage-result.json to signal control plane for manifest commit.
 *
 * This is a data-plane stage worker. It writes ONLY to `stages/S5B/`.
 * The actual manifest commit (candidate → current) is done by the
 * control plane when it reads S5B's Done stage-result.
 *
 * @see docs/business-os/startup-loop/stage-result-schema.md
 * @see docs/business-os/startup-loop/manifest-schema.md
 */

import { promises as fs } from "fs";
import path from "path";

import type { StageResult } from "./manifest-update";

// -- Types --

export interface UpsertResult {
  created: boolean;
  entitySha: string;
}

export interface BosApiClient {
  upsertCard(cardId: string, data: Record<string, unknown>): Promise<UpsertResult>;
  upsertStageDoc(cardId: string, stage: string, content: string): Promise<UpsertResult>;
}

export interface BosSyncOptions {
  run_id: string;
  business: string;
  loop_spec_version: string;
  api: BosApiClient;
}

export interface BosSyncSuccess {
  success: true;
  stage_result: StageResult;
  cards_synced: number;
}

export interface BosSyncFailure {
  success: false;
  stage_result: StageResult;
}

export type BosSyncResult = BosSyncSuccess | BosSyncFailure;

// -- Main --

export async function bosSync(
  runDir: string,
  options: BosSyncOptions,
): Promise<BosSyncResult> {
  const s5bDir = path.join(runDir, "stages", "S5B");
  await fs.mkdir(s5bDir, { recursive: true });

  // 1. Gate on S5A completion
  const s5aResultPath = path.join(runDir, "stages", "S5A", "stage-result.json");
  let s5aResult: StageResult | null = null;
  try {
    s5aResult = JSON.parse(await fs.readFile(s5aResultPath, "utf-8"));
  } catch {
    // S5A result not found
  }

  if (!s5aResult || s5aResult.status !== "Done") {
    const reason = !s5aResult
      ? "S5A stage-result.json not found — S5A not complete"
      : `S5A status=${s5aResult.status} — S5A not complete`;
    const stageResult = makeStageResult(options, "Blocked", reason);
    await writeStageResult(s5bDir, stageResult);
    return { success: false, stage_result: stageResult };
  }

  // 2. Read S5A prioritized items artifact
  const prioritizedPath = s5aResult.artifacts.prioritized_items;
  let prioritizedContent: string;
  try {
    prioritizedContent = await fs.readFile(
      path.join(runDir, prioritizedPath),
      "utf-8",
    );
  } catch {
    const stageResult = makeStageResult(
      options,
      "Failed",
      null,
      `Artifact file missing: ${prioritizedPath} referenced in S5A stage-result`,
    );
    await writeStageResult(s5bDir, stageResult);
    return { success: false, stage_result: stageResult };
  }

  // 3. Persist to BOS via API (idempotent upserts)
  const cardId = `${options.business}-BASELINE-${options.run_id}`;
  let cardsSynced = 0;

  try {
    // Upsert the baseline card
    await options.api.upsertCard(cardId, {
      title: `Baseline: ${options.business} (${options.run_id})`,
      business: options.business,
      run_id: options.run_id,
      loop_spec_version: options.loop_spec_version,
    });
    cardsSynced++;

    // Upsert the build stage doc with prioritized items
    await options.api.upsertStageDoc(cardId, "build", prioritizedContent);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const stageResult = makeStageResult(
      options,
      "Failed",
      null,
      `BOS API error: ${errorMsg}`,
    );
    await writeStageResult(s5bDir, stageResult);
    return { success: false, stage_result: stageResult };
  }

  // 4. Write success stage-result (signals control plane to commit manifest)
  const stageResult: StageResult = {
    schema_version: 1,
    run_id: options.run_id,
    stage: "S5B",
    loop_spec_version: options.loop_spec_version,
    status: "Done",
    timestamp: new Date().toISOString(),
    produced_keys: [],
    artifacts: {},
    error: null,
    blocking_reason: null,
  };
  await writeStageResult(s5bDir, stageResult);

  return {
    success: true,
    stage_result: stageResult,
    cards_synced: cardsSynced,
  };
}

// -- Helpers --

function makeStageResult(
  options: BosSyncOptions,
  status: "Blocked" | "Failed",
  blockingReason?: string | null,
  error?: string | null,
): StageResult {
  return {
    schema_version: 1,
    run_id: options.run_id,
    stage: "S5B",
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
  s5bDir: string,
  stageResult: StageResult,
): Promise<void> {
  await fs.writeFile(
    path.join(s5bDir, "stage-result.json"),
    JSON.stringify(stageResult, null, 2),
  );
}
