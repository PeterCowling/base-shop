/**
 * LAUNCH-07: Idempotency + Resume State Management
 *
 * Provides checkpoint-based state persistence for launch-shop pipeline.
 * Enables:
 * - Resume from last successful step after failure
 * - Idempotent step execution (skip already-completed steps)
 * - Launch history tracking
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync,readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { GoLiveGateResult,LaunchStep, StepResult } from "./types";

// ============================================================
// Types
// ============================================================

export type LaunchStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export interface LaunchCheckpoint {
  /** Unique launch identifier */
  launchId: string;
  /** Shop being launched */
  shopId: string;
  /** Config file hash for change detection */
  configHash: string;
  /** Launch mode */
  mode: "preview" | "production";
  /** Current overall status */
  status: LaunchStatus;
  /** Last completed step */
  lastCompletedStep?: LaunchStep;
  /** Step that failed (if any) */
  failedStep?: LaunchStep;
  /** Error message from failed step */
  failedError?: string;
  /** Whether failure is recoverable */
  failedRecoverable?: boolean;
  /** Completed step results */
  completedSteps: StepResult[];
  /** Go-live gate results (if run) */
  goLiveGates?: GoLiveGateResult[];
  /** Warnings accumulated */
  warnings: string[];
  /** Deploy URL (once known) */
  deployUrl?: string;
  /** Workflow run URL (once known) */
  workflowRunUrl?: string;
  /** When launch started */
  startedAt: string;
  /** When last updated */
  updatedAt: string;
  /** When completed (if finished) */
  completedAt?: string;
  /** Resume count (how many times resumed) */
  resumeCount: number;
}

export interface ResumeInfo {
  /** Whether resume is possible */
  canResume: boolean;
  /** Checkpoint to resume from */
  checkpoint?: LaunchCheckpoint;
  /** Step to resume from */
  resumeFromStep?: LaunchStep;
  /** Reason if can't resume */
  reason?: string;
}

// ============================================================
// Constants
// ============================================================

/** Directory where launch state is stored */
const STATE_DIR = "data/launch-state";

/** Maximum age of state file to consider for resume (24 hours) */
const MAX_STATE_AGE_MS = 24 * 60 * 60 * 1000;

/** Step execution order */
const STEP_ORDER: LaunchStep[] = [
  "preflight",
  "go-live-gates",
  "scaffold",
  "secrets",
  "ci-setup",
  "commit",
  "deploy",
  "webhook",
  "smoke",
  "report",
];

// ============================================================
// State Directory Management
// ============================================================

/**
 * Ensure the state directory exists.
 */
function ensureStateDir(): string {
  const dir = join(process.cwd(), STATE_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Get the state file path for a shop.
 */
function getStateFilePath(shopId: string): string {
  return join(ensureStateDir(), `${shopId}.state.json`);
}

/**
 * Get the archive directory for completed launches.
 */
function getArchiveDir(): string {
  const dir = join(ensureStateDir(), "archive");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ============================================================
// Config Hashing
// ============================================================

/**
 * Generate a hash of the config for change detection.
 */
export function hashConfig(config: unknown): string {
  const content = JSON.stringify(config, Object.keys(config as object).sort());
  return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

// ============================================================
// State Persistence
// ============================================================

/**
 * Load the current checkpoint for a shop.
 */
export function loadCheckpoint(shopId: string): LaunchCheckpoint | undefined {
  const path = getStateFilePath(shopId);
  if (!existsSync(path)) {
    return undefined;
  }

  try {
    const content = readFileSync(path, "utf8");
    return JSON.parse(content) as LaunchCheckpoint;
  } catch {
    return undefined;
  }
}

/**
 * Save checkpoint state.
 */
export function saveCheckpoint(checkpoint: LaunchCheckpoint): void {
  const path = getStateFilePath(checkpoint.shopId);
  checkpoint.updatedAt = new Date().toISOString();
  writeFileSync(path, JSON.stringify(checkpoint, null, 2));
}

/**
 * Create a new checkpoint for a launch.
 */
export function createCheckpoint(
  launchId: string,
  shopId: string,
  configHash: string,
  mode: "preview" | "production"
): LaunchCheckpoint {
  const now = new Date().toISOString();
  return {
    launchId,
    shopId,
    configHash,
    mode,
    status: "pending",
    completedSteps: [],
    warnings: [],
    startedAt: now,
    updatedAt: now,
    resumeCount: 0,
  };
}

/**
 * Mark a step as completed in the checkpoint.
 */
export function markStepCompleted(
  checkpoint: LaunchCheckpoint,
  result: StepResult
): void {
  checkpoint.completedSteps.push(result);
  checkpoint.lastCompletedStep = result.name;
  checkpoint.status = "in_progress";
  saveCheckpoint(checkpoint);
}

/**
 * Mark launch as failed.
 */
export function markLaunchFailed(
  checkpoint: LaunchCheckpoint,
  step: LaunchStep,
  error: string,
  recoverable: boolean
): void {
  checkpoint.status = "failed";
  checkpoint.failedStep = step;
  checkpoint.failedError = error;
  checkpoint.failedRecoverable = recoverable;
  saveCheckpoint(checkpoint);
}

/**
 * Mark launch as completed successfully.
 */
export function markLaunchCompleted(checkpoint: LaunchCheckpoint): void {
  checkpoint.status = "completed";
  checkpoint.completedAt = new Date().toISOString();
  saveCheckpoint(checkpoint);

  // Archive the completed checkpoint
  archiveCheckpoint(checkpoint);
}

/**
 * Archive a completed checkpoint.
 */
function archiveCheckpoint(checkpoint: LaunchCheckpoint): void {
  const archiveDir = getArchiveDir();
  const archivePath = join(
    archiveDir,
    `${checkpoint.shopId}-${checkpoint.launchId}.json`
  );
  writeFileSync(archivePath, JSON.stringify(checkpoint, null, 2));

  // Remove active state file
  const statePath = getStateFilePath(checkpoint.shopId);
  if (existsSync(statePath)) {
    const fs = require("node:fs");
    fs.unlinkSync(statePath);
  }
}

/**
 * Cancel an in-progress launch.
 */
export function cancelLaunch(shopId: string): boolean {
  const checkpoint = loadCheckpoint(shopId);
  if (!checkpoint || checkpoint.status === "completed") {
    return false;
  }

  checkpoint.status = "cancelled";
  checkpoint.completedAt = new Date().toISOString();
  saveCheckpoint(checkpoint);
  archiveCheckpoint(checkpoint);
  return true;
}

// ============================================================
// Resume Logic
// ============================================================

/**
 * Check if a launch can be resumed.
 */
export function checkResumeability(
  shopId: string,
  configHash: string
): ResumeInfo {
  const checkpoint = loadCheckpoint(shopId);

  // No existing checkpoint
  if (!checkpoint) {
    return { canResume: false, reason: "No existing launch state" };
  }

  // Already completed
  if (checkpoint.status === "completed") {
    return { canResume: false, reason: "Previous launch already completed" };
  }

  // Cancelled
  if (checkpoint.status === "cancelled") {
    return { canResume: false, reason: "Previous launch was cancelled" };
  }

  // Config changed
  if (checkpoint.configHash !== configHash) {
    return {
      canResume: false,
      reason: `Config changed (was: ${checkpoint.configHash}, now: ${configHash})`,
      checkpoint,
    };
  }

  // Check if state is too old
  const stateAge = Date.now() - new Date(checkpoint.updatedAt).getTime();
  if (stateAge > MAX_STATE_AGE_MS) {
    return {
      canResume: false,
      reason: `State too old (${Math.round(stateAge / 3600000)} hours)`,
      checkpoint,
    };
  }

  // Failed but not recoverable
  if (checkpoint.status === "failed" && !checkpoint.failedRecoverable) {
    return {
      canResume: false,
      reason: `Previous failure not recoverable: ${checkpoint.failedError}`,
      checkpoint,
    };
  }

  // Determine resume point
  const resumeFromStep = getResumeStep(checkpoint);

  return {
    canResume: true,
    checkpoint,
    resumeFromStep,
  };
}

/**
 * Get the step to resume from based on checkpoint state.
 */
function getResumeStep(checkpoint: LaunchCheckpoint): LaunchStep {
  // If failed, retry from the failed step
  if (checkpoint.failedStep) {
    return checkpoint.failedStep;
  }

  // If has completed steps, resume from next step
  if (checkpoint.lastCompletedStep) {
    const lastIndex = STEP_ORDER.indexOf(checkpoint.lastCompletedStep);
    if (lastIndex >= 0 && lastIndex < STEP_ORDER.length - 1) {
      return STEP_ORDER[lastIndex + 1];
    }
  }

  // Default to preflight
  return "preflight";
}

/**
 * Check if a step should be skipped (already completed).
 */
export function shouldSkipStep(
  checkpoint: LaunchCheckpoint,
  step: LaunchStep
): boolean {
  // Check if step is in completed steps
  return checkpoint.completedSteps.some(
    (s) => s.name === step && s.status === "success"
  );
}

/**
 * Get the index of a step in the execution order.
 */
export function getStepIndex(step: LaunchStep): number {
  return STEP_ORDER.indexOf(step);
}

/**
 * Prepare checkpoint for resume.
 */
export function prepareForResume(checkpoint: LaunchCheckpoint): void {
  checkpoint.resumeCount += 1;
  checkpoint.status = "in_progress";
  checkpoint.failedStep = undefined;
  checkpoint.failedError = undefined;
  checkpoint.failedRecoverable = undefined;
  saveCheckpoint(checkpoint);
}

// ============================================================
// History & Cleanup
// ============================================================

/**
 * List recent launches for a shop.
 */
export function listRecentLaunches(shopId: string): LaunchCheckpoint[] {
  const archiveDir = getArchiveDir();
  const launches: LaunchCheckpoint[] = [];

  if (!existsSync(archiveDir)) {
    return launches;
  }

  const files = readdirSync(archiveDir);
  for (const file of files) {
    if (file.startsWith(`${shopId}-`) && file.endsWith(".json")) {
      try {
        const content = readFileSync(join(archiveDir, file), "utf8");
        launches.push(JSON.parse(content));
      } catch {
        // Skip invalid files
      }
    }
  }

  // Sort by start time (newest first)
  return launches.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

/**
 * Clean up old archived launches (keep last N).
 */
export function cleanupOldLaunches(shopId: string, keepCount: number = 10): number {
  const launches = listRecentLaunches(shopId);
  let removed = 0;

  if (launches.length <= keepCount) {
    return 0;
  }

  const archiveDir = getArchiveDir();
  const toRemove = launches.slice(keepCount);

  for (const launch of toRemove) {
    const path = join(archiveDir, `${launch.shopId}-${launch.launchId}.json`);
    if (existsSync(path)) {
      const fs = require("node:fs");
      fs.unlinkSync(path);
      removed++;
    }
  }

  return removed;
}

// ============================================================
// Utilities
// ============================================================

/**
 * Format checkpoint status for display.
 */
export function formatCheckpointStatus(checkpoint: LaunchCheckpoint): string {
  const lines: string[] = [];

  lines.push(`Launch ID: ${checkpoint.launchId}`);
  lines.push(`Shop: ${checkpoint.shopId}`);
  lines.push(`Status: ${checkpoint.status}`);
  lines.push(`Mode: ${checkpoint.mode}`);
  lines.push(`Started: ${checkpoint.startedAt}`);

  if (checkpoint.lastCompletedStep) {
    lines.push(`Last completed: ${checkpoint.lastCompletedStep}`);
  }

  if (checkpoint.failedStep) {
    lines.push(`Failed at: ${checkpoint.failedStep}`);
    lines.push(`Error: ${checkpoint.failedError}`);
    lines.push(`Recoverable: ${checkpoint.failedRecoverable ? "yes" : "no"}`);
  }

  lines.push(`Resume count: ${checkpoint.resumeCount}`);

  if (checkpoint.deployUrl) {
    lines.push(`Deploy URL: ${checkpoint.deployUrl}`);
  }

  return lines.join("\n");
}

export { STEP_ORDER };
