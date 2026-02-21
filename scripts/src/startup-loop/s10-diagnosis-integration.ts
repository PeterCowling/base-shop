/**
 * BL-07: S10 diagnosis pipeline integration
 *
 * Orchestrates the full diagnosis pipeline on S10 completion:
 * 1. Generate diagnosis snapshot (BL-04)
 * 2. Append to history ledger (BL-05)
 * 3. Check constraint persistence (BL-05)
 * 4. Evaluate replan trigger (BL-06)
 * 5. Run growth accounting integration (GAK-06, optional)
 * 6. Write artifact pointers to stage-result.json
 *
 * The pipeline is non-blocking — S10 completion succeeds even if diagnosis steps fail.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { appendBottleneckHistory, checkConstraintPersistence } from "./bottleneck-history";
import { type DiagnosisSnapshot,generateDiagnosisSnapshot } from "./diagnosis-snapshot";
import { type McpPreflightResult,runMcpPreflight } from "./mcp-preflight";
import { checkAndTriggerReplan, type ReplanTrigger } from "./replan-trigger";
import {
  type GrowthAccountingEventPayload,
  runS10GrowthAccounting,
  type S10GrowthAccountingResult,
} from "./s10-growth-accounting";

// -- Type definitions --

export interface DiagnosisPipelineOptions {
  baseDir?: string;
  mcpPreflight?: {
    enabled?: boolean;
    profile?: "local" | "ci" | "deployed";
  };
  growthAccounting?: {
    enabled?: boolean;
    period?: {
      period_id: string;
      start_date: string;
      end_date: string;
      forecast_id: string;
    };
    dataRoot?: string;
    timestamp?: string;
    loopSpecVersion?: string;
  };
  persistenceThreshold?: number;
  minSeverity?: "moderate" | "critical";
}

export interface DiagnosisPipelineResult {
  snapshot: DiagnosisSnapshot | null;
  historyAppended: boolean;
  persistenceCheck: { persistent: boolean; constraint_key: string | null } | null;
  replanTrigger: ReplanTrigger | null;
  growthAccounting: S10GrowthAccountingResult | null;
  growthEventPayload: GrowthAccountingEventPayload | null;
  artifactPointer: string;
  warnings: string[];
}

function summarizePreflightIssues(result: McpPreflightResult): string {
  const errorCodes = result.errors.map((issue) => issue.code);
  const warningCodes = result.warnings.map((issue) => issue.code);

  return JSON.stringify(
    {
      profile: result.profile,
      ok: result.ok,
      errors: errorCodes,
      warnings: warningCodes,
    },
    null,
    0,
  );
}

// -- Helper functions --

/**
 * Write or update stage-result.json with diagnosis artifact pointer
 */
function writeStageResultArtifact(
  business: string,
  runId: string,
  baseDir: string,
  growthAccounting: S10GrowthAccountingResult | null = null,
): void {
  const stageResultPath = path.join(
    baseDir,
    "docs/business-os/startup-baselines",
    business,
    "runs",
    runId,
    "stages/S10/stage-result.json"
  );

  const stageResultDir = path.dirname(stageResultPath);

  // Ensure directory exists
  if (!fs.existsSync(stageResultDir)) {
    fs.mkdirSync(stageResultDir, { recursive: true });
  }

  // Read existing stage-result or create minimal structure
  let stageResult: any = {
    artifacts: {},
  };

  if (fs.existsSync(stageResultPath)) {
    const content = fs.readFileSync(stageResultPath, "utf-8");
    stageResult = JSON.parse(content);

    // Ensure artifacts field exists
    if (!stageResult.artifacts) {
      stageResult.artifacts = {};
    }
  }

  // Add/update diagnosis artifact pointer
  stageResult.artifacts.bottleneck_diagnosis = "bottleneck-diagnosis.json";

  if (growthAccounting) {
    stageResult.artifacts.growth_ledger = path.relative(
      path.dirname(stageResultPath),
      growthAccounting.ledgerPath,
    );
    stageResult.growth_accounting = {
      ...growthAccounting.stageSummary,
      data_quality: growthAccounting.metrics.data_quality,
      sources: growthAccounting.metrics.sources,
    };
  }

  // Write atomically
  const tmpPath = `${stageResultPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(stageResult, null, 2), "utf-8");
  fs.renameSync(tmpPath, stageResultPath);
}

// -- Main function --

/**
 * Run the full diagnosis pipeline on S10 completion
 *
 * This function orchestrates BL-04, BL-05, and BL-06 in sequence:
 * 1. Generate diagnosis snapshot with prior comparison
 * 2. Append to bottleneck history ledger
 * 3. Check constraint persistence
 * 4. Evaluate replan trigger
 * 5. Write artifact pointer to stage-result.json
 *
 * The pipeline is resilient to failures — each step is wrapped in try/catch
 * and failures are logged as warnings but do not block S10 completion.
 *
 * @param runId - The run identifier (e.g., "2026-02-13-001")
 * @param business - The business identifier (e.g., "HEAD", "BRIK", "PET")
 * @param options - Optional configuration (baseDir, persistence threshold, severity gate)
 * @returns Pipeline result with snapshot, history status, persistence check, trigger, and warnings
 */
export async function runDiagnosisPipeline(
  runId: string,
  business: string,
  options?: DiagnosisPipelineOptions
): Promise<DiagnosisPipelineResult> {
  const baseDir = options?.baseDir ?? process.cwd();
  const warnings: string[] = [];

  let snapshot: DiagnosisSnapshot | null = null;
  let historyAppended = false;
  let persistenceCheck: { persistent: boolean; constraint_key: string | null } | null = null;
  let replanTrigger: ReplanTrigger | null = null;
  let growthAccounting: S10GrowthAccountingResult | null = null;

  // Optional advisory preflight for startup-loop MCP data-plane readiness.
  // Auto-on for default runtime invocation; disabled in fixture/temp-dir test runs.
  const shouldRunMcpPreflight =
    options?.mcpPreflight?.enabled ?? baseDir === process.cwd();
  if (shouldRunMcpPreflight) {
    try {
      const preflightProfile =
        options?.mcpPreflight?.profile ?? (process.env.CI ? "ci" : "local");
      const preflightResult = runMcpPreflight(
        {
          profile: preflightProfile,
          repoRoot: baseDir,
        },
        process.env,
      );

      if (!preflightResult.ok) {
        const warning = `MCP preflight reported blocking issues: ${summarizePreflightIssues(preflightResult)}`;
        warnings.push(warning);
        console.warn(warning);
      } else if (preflightResult.warnings.length > 0) {
        const warning = `MCP preflight reported advisory warnings: ${summarizePreflightIssues(preflightResult)}`;
        warnings.push(warning);
        console.warn(warning);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const warning = `MCP preflight execution failed: ${errorMessage}`;
      warnings.push(warning);
      console.warn(warning);
    }
  }

  // Step 1: Generate diagnosis snapshot (BL-04)
  try {
    snapshot = generateDiagnosisSnapshot(runId, business, baseDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const warning = `Diagnosis snapshot generation failed: ${errorMessage}`;
    warnings.push(warning);
    console.warn(warning);

    // Return early with partial result — no snapshot means we can't proceed
    return {
      snapshot: null,
      historyAppended: false,
      persistenceCheck: null,
      replanTrigger: null,
      growthAccounting: null,
      growthEventPayload: null,
      artifactPointer: "bottleneck-diagnosis.json",
      warnings,
    };
  }

  // Step 2: Append to bottleneck history (BL-05)
  try {
    const appendResult = appendBottleneckHistory(business, snapshot, baseDir);
    historyAppended = appendResult.appended;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const warning = `History append failed: ${errorMessage}`;
    warnings.push(warning);
    console.warn(warning);
    // Continue pipeline — history append failure is non-fatal
  }

  // Step 3: Check constraint persistence (BL-05)
  try {
    const persistenceThreshold = options?.persistenceThreshold ?? 3;
    persistenceCheck = checkConstraintPersistence(business, persistenceThreshold, baseDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const warning = `Persistence check failed: ${errorMessage}`;
    warnings.push(warning);
    console.warn(warning);
    // Continue pipeline — persistence check failure is non-fatal
  }

  // Step 4: Evaluate replan trigger (BL-06)
  try {
    const triggerOptions = {
      persistenceThreshold: options?.persistenceThreshold,
      minSeverity: options?.minSeverity,
      baseDir,
    };
    replanTrigger = checkAndTriggerReplan(business, snapshot, triggerOptions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const warning = `Replan trigger evaluation failed: ${errorMessage}`;
    warnings.push(warning);
    console.warn(warning);
    // Continue pipeline — trigger evaluation failure is non-fatal
  }

  // Step 5: Run growth accounting integration (optional)
  if (options?.growthAccounting?.enabled) {
    try {
      growthAccounting = await runS10GrowthAccounting(runId, business, {
        baseDir,
        dataRoot: options.growthAccounting.dataRoot,
        period: options.growthAccounting.period,
        timestamp: options.growthAccounting.timestamp,
        loopSpecVersion: options.growthAccounting.loopSpecVersion,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const warning = `Growth accounting integration failed: ${errorMessage}`;
      warnings.push(warning);
      console.warn(warning);
      // Continue pipeline — growth integration failure is non-fatal
    }
  }

  // Step 6: Write artifact pointers to stage-result.json
  try {
    writeStageResultArtifact(business, runId, baseDir, growthAccounting);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const warning = `Stage-result artifact pointer write failed: ${errorMessage}`;
    warnings.push(warning);
    console.warn(warning);
    // Continue — stage-result write failure is non-fatal
  }

  return {
    snapshot,
    historyAppended,
    persistenceCheck,
    replanTrigger,
    growthAccounting,
    growthEventPayload: growthAccounting?.eventPayload ?? null,
    artifactPointer: "bottleneck-diagnosis.json",
    warnings,
  };
}
