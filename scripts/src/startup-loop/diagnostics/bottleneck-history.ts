/**
 * BL-05: Idempotent bottleneck history ledger and persistence check
 *
 * Maintains append-only JSONL ledger of bottleneck diagnoses with:
 * - Idempotent append by run_id
 * - Rolling-window reads
 * - Persistence checks with explicit breakers for no_bottleneck and insufficient_data
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { type DiagnosisSnapshot } from "./diagnosis-snapshot";

// -- Type definitions --

export interface BottleneckEntry {
  timestamp: string;
  run_id: string;
  diagnosis_status: string;
  constraint_key: string;
  constraint_stage: string | null;
  constraint_metric: string | null;
  reason_code: string | null;
  severity: string;
}

// -- Helper functions --

function getHistoryPath(business: string, baseDir?: string): string {
  const root = baseDir ?? process.cwd();
  return path.join(root, "docs/business-os/startup-baselines", business, "bottleneck-history.jsonl");
}

function readHistoryEntries(historyPath: string): BottleneckEntry[] {
  if (!fs.existsSync(historyPath)) {
    return [];
  }

  const content = fs.readFileSync(historyPath, "utf-8");
  if (!content.trim()) {
    return [];
  }

  return content
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as BottleneckEntry);
}

// -- Public API --

/**
 * Append a bottleneck diagnosis to the history ledger.
 * Implements idempotent append by run_id (duplicate writes are no-ops).
 *
 * @param business - Business identifier (e.g., 'HEAD', 'BRIK', 'PET')
 * @param diagnosis - Diagnosis snapshot from BL-04
 * @param baseDir - Optional base directory (for testing)
 * @returns Object indicating whether entry was appended
 */
export function appendBottleneckHistory(
  business: string,
  diagnosis: DiagnosisSnapshot,
  baseDir?: string
): { appended: boolean } {
  const historyPath = getHistoryPath(business, baseDir);
  const historyDir = path.dirname(historyPath);

  // Ensure directory exists
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  // Read existing entries for dedup check
  const existingEntries = readHistoryEntries(historyPath);

  // Check for duplicate run_id (deduplication)
  const isDuplicate = existingEntries.some((e) => e.run_id === diagnosis.run_id);
  if (isDuplicate) {
    return { appended: false };
  }

  // Build entry based on diagnosis status
  let entry: BottleneckEntry;

  if (diagnosis.diagnosis_status === "no_bottleneck") {
    // Encode no_bottleneck with constraint_key="none", severity="none"
    entry = {
      timestamp: diagnosis.timestamp,
      run_id: diagnosis.run_id,
      diagnosis_status: diagnosis.diagnosis_status,
      constraint_key: "none",
      constraint_stage: null,
      constraint_metric: null,
      reason_code: null,
      severity: "none",
    };
  } else if (
    diagnosis.diagnosis_status === "insufficient_data" &&
    !diagnosis.identified_constraint
  ) {
    // Encode insufficient_data with no constraint as constraint_key="insufficient_data", severity="none"
    entry = {
      timestamp: diagnosis.timestamp,
      run_id: diagnosis.run_id,
      diagnosis_status: diagnosis.diagnosis_status,
      constraint_key: "insufficient_data",
      constraint_stage: null,
      constraint_metric: null,
      reason_code: null,
      severity: "none",
    };
  } else if (diagnosis.identified_constraint) {
    // Normal constraint case
    entry = {
      timestamp: diagnosis.timestamp,
      run_id: diagnosis.run_id,
      diagnosis_status: diagnosis.diagnosis_status,
      constraint_key: diagnosis.identified_constraint.constraint_key,
      constraint_stage: diagnosis.identified_constraint.stage,
      constraint_metric: diagnosis.identified_constraint.metric,
      reason_code: diagnosis.identified_constraint.reason_code,
      severity: diagnosis.identified_constraint.severity,
    };
  } else {
    // Fallback for unexpected cases
    entry = {
      timestamp: diagnosis.timestamp,
      run_id: diagnosis.run_id,
      diagnosis_status: diagnosis.diagnosis_status,
      constraint_key: "insufficient_data",
      constraint_stage: null,
      constraint_metric: null,
      reason_code: null,
      severity: "none",
    };
  }

  // Append entry to ledger
  const entryLine = JSON.stringify(entry) + "\n";
  fs.appendFileSync(historyPath, entryLine, "utf-8");

  return { appended: true };
}

/**
 * Get recent bottleneck entries from the history ledger.
 * Returns last N entries in ledger order (oldest to newest).
 *
 * @param business - Business identifier
 * @param N - Number of recent entries to retrieve
 * @param baseDir - Optional base directory (for testing)
 * @returns Array of bottleneck entries in ledger order
 */
export function getRecentBottlenecks(
  business: string,
  N: number,
  baseDir?: string
): BottleneckEntry[] {
  const historyPath = getHistoryPath(business, baseDir);
  const allEntries = readHistoryEntries(historyPath);

  // Return last N entries
  if (allEntries.length <= N) {
    return allEntries;
  }

  return allEntries.slice(-N);
}

/**
 * Check if a constraint has persisted across the last N runs.
 * Returns persistent=true only if all last N entries have the same
 * constraint_key AND that key is not a breaker ("none" or "insufficient_data").
 *
 * @param business - Business identifier
 * @param N - Number of recent runs to check
 * @param baseDir - Optional base directory (for testing)
 * @returns Object with persistence status and constraint key
 */
export function checkConstraintPersistence(
  business: string,
  N: number,
  baseDir?: string
): { persistent: boolean; constraint_key: string | null } {
  const historyPath = getHistoryPath(business, baseDir);
  const allEntries = readHistoryEntries(historyPath);

  // If we don't have N entries, return non-persistent
  if (allEntries.length < N) {
    return { persistent: false, constraint_key: null };
  }

  // Get last N entries
  const recentEntries = allEntries.slice(-N);

  // Check if all have the same constraint_key
  const firstKey = recentEntries[0].constraint_key;

  // Breaker keys: "none" and "insufficient_data"
  const breakerKeys = new Set(["none", "insufficient_data"]);

  // If first key is a breaker, return non-persistent
  if (breakerKeys.has(firstKey)) {
    return { persistent: false, constraint_key: null };
  }

  // Check if all N entries have the same constraint_key
  const allSame = recentEntries.every((entry) => entry.constraint_key === firstKey);

  if (allSame) {
    return { persistent: true, constraint_key: firstKey };
  }

  return { persistent: false, constraint_key: null };
}
