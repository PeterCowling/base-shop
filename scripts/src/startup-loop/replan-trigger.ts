/**
 * BL-06: Guarded replan trigger with severity gate and lifecycle state
 *
 * Evaluates constraint persistence + severity gate after each diagnosis and
 * manages replan trigger lifecycle (open → acknowledged → resolved → reopen).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { checkConstraintPersistence, getRecentBottlenecks } from "./bottleneck-history";
import { type DiagnosisSnapshot } from "./diagnosis-snapshot";

// -- Type definitions --

export interface ReplanTriggerOptions {
  persistenceThreshold?: number;
  minSeverity?: "moderate" | "critical";
  autoResolveAfterNonPersistentRuns?: number;
}

export interface ReplanTrigger {
  status: "open" | "acknowledged" | "resolved";
  created_at: string;
  last_evaluated_at: string;
  resolved_at: string | null;
  reopened_count: number;
  last_reopened_at: string | null;
  constraint: {
    constraint_key: string;
    stage: string;
    metric: string | null;
    severity: string;
  };
  run_history: string[];
  reason: string;
  recommended_focus: string;
  min_severity: string;
  persistence_threshold: number;
  non_persistent_count?: number;
}

// -- Helper functions --

function getTriggerPath(business: string, baseDir?: string): string {
  const root = baseDir ?? process.cwd();
  return path.join(root, "docs/business-os/startup-baselines", business, "replan-trigger.json");
}

function readExistingTrigger(triggerPath: string): ReplanTrigger | null {
  if (!fs.existsSync(triggerPath)) {
    return null;
  }

  const content = fs.readFileSync(triggerPath, "utf-8");
  return JSON.parse(content) as ReplanTrigger;
}

function atomicWriteTrigger(triggerPath: string, trigger: ReplanTrigger): void {
  const triggerDir = path.dirname(triggerPath);

  if (!fs.existsSync(triggerDir)) {
    fs.mkdirSync(triggerDir, { recursive: true });
  }

  const tmpPath = `${triggerPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(trigger, null, 2), "utf-8");
  fs.renameSync(tmpPath, triggerPath);
}

function getRecommendedFocus(constraintKey: string): string {
  // S3/cvr → conversion optimization
  if (constraintKey === "S3/cvr") {
    return "Improve conversion rate through offer clarity, trust signals, or checkout optimization";
  }

  // S6B/traffic → traffic acquisition
  if (constraintKey === "S6B/traffic") {
    return "Increase traffic through SEO, paid acquisition, or content marketing";
  }

  // S6B/cac → cost optimization
  if (constraintKey === "S6B/cac") {
    return "Reduce customer acquisition cost through channel optimization or targeting";
  }

  // S2B/aov → AOV optimization
  if (constraintKey === "S2B/aov") {
    return "Increase average order value through upsells, bundles, or pricing";
  }

  // Any stage_blocked → blocker resolution
  if (constraintKey.includes("stage_blocked")) {
    return "Resolve stage blocker before addressing metric constraints";
  }

  // Default
  return "Review constraint and plan targeted intervention";
}

function checkSeverityGate(severity: string, minSeverity: "moderate" | "critical"): boolean {
  const severityRank: Record<string, number> = {
    critical: 3,
    moderate: 2,
    minor: 1,
    none: 0,
  };

  const minRank = severityRank[minSeverity] ?? 0;
  const actualRank = severityRank[severity] ?? 0;

  return actualRank >= minRank;
}

// -- Main function --

export function checkAndTriggerReplan(
  business: string,
  diagnosis: DiagnosisSnapshot,
  options?: ReplanTriggerOptions & { baseDir?: string }
): ReplanTrigger | null {
  const persistenceThreshold = options?.persistenceThreshold ?? 3;
  const minSeverity = options?.minSeverity ?? "moderate";
  const autoResolveAfterNonPersistentRuns = options?.autoResolveAfterNonPersistentRuns ?? 2;
  const baseDir = options?.baseDir;

  const triggerPath = getTriggerPath(business, baseDir);
  const existingTrigger = readExistingTrigger(triggerPath);

  // Step 1: Check persistence
  const persistence = checkConstraintPersistence(business, persistenceThreshold, baseDir);

  // Step 2: Handle non-persistent case
  if (!persistence.persistent) {
    if (!existingTrigger) {
      return null;
    }

    // Update existing trigger
    const nonPersistentCount = (existingTrigger.non_persistent_count ?? 0) + 1;

    if (nonPersistentCount >= autoResolveAfterNonPersistentRuns) {
      // Auto-resolve
      const resolvedTrigger: ReplanTrigger = {
        ...existingTrigger,
        status: "resolved",
        last_evaluated_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        non_persistent_count: nonPersistentCount,
      };

      atomicWriteTrigger(triggerPath, resolvedTrigger);
      return resolvedTrigger;
    }

    // Still open/acknowledged, just update eval time and count
    const updatedTrigger: ReplanTrigger = {
      ...existingTrigger,
      last_evaluated_at: new Date().toISOString(),
      non_persistent_count: nonPersistentCount,
    };

    atomicWriteTrigger(triggerPath, updatedTrigger);
    return updatedTrigger;
  }

  // Step 3: Persistent constraint detected — get constraint details
  const recentBottlenecks = getRecentBottlenecks(business, persistenceThreshold, baseDir);
  const latestBottleneck = recentBottlenecks[recentBottlenecks.length - 1];

  const constraintKey = persistence.constraint_key!;
  const constraintSeverity = latestBottleneck.severity;

  // Step 4: Check severity gate
  if (!checkSeverityGate(constraintSeverity, minSeverity)) {
    // Severity doesn't meet gate
    if (existingTrigger) {
      // Update last_evaluated_at but don't change status
      const updatedTrigger: ReplanTrigger = {
        ...existingTrigger,
        last_evaluated_at: new Date().toISOString(),
        non_persistent_count: 0, // Reset non-persistent count since we have persistence
      };

      atomicWriteTrigger(triggerPath, updatedTrigger);
      return updatedTrigger;
    }

    return null;
  }

  // Step 5: Severity gate passed — handle trigger creation/update/reopen
  const runHistory = recentBottlenecks.map((b) => b.run_id);
  const now = new Date().toISOString();

  if (!existingTrigger) {
    // Create new trigger
    const newTrigger: ReplanTrigger = {
      status: "open",
      created_at: now,
      last_evaluated_at: now,
      resolved_at: null,
      reopened_count: 0,
      last_reopened_at: null,
      constraint: {
        constraint_key: constraintKey,
        stage: latestBottleneck.constraint_stage ?? "",
        metric: latestBottleneck.constraint_metric,
        severity: constraintSeverity,
      },
      run_history: runHistory,
      reason: `Constraint ${constraintKey} persisted for ${persistenceThreshold} runs with ${constraintSeverity} severity`,
      recommended_focus: getRecommendedFocus(constraintKey),
      min_severity: minSeverity,
      persistence_threshold: persistenceThreshold,
      non_persistent_count: 0,
    };

    atomicWriteTrigger(triggerPath, newTrigger);
    return newTrigger;
  }

  if (existingTrigger.status === "resolved") {
    // Reopen trigger
    const reopenedTrigger: ReplanTrigger = {
      ...existingTrigger,
      status: "open",
      last_evaluated_at: now,
      resolved_at: null,
      reopened_count: existingTrigger.reopened_count + 1,
      last_reopened_at: now,
      constraint: {
        constraint_key: constraintKey,
        stage: latestBottleneck.constraint_stage ?? "",
        metric: latestBottleneck.constraint_metric,
        severity: constraintSeverity,
      },
      run_history: runHistory,
      reason: `Constraint ${constraintKey} persisted again after resolution`,
      recommended_focus: getRecommendedFocus(constraintKey),
      non_persistent_count: 0,
    };

    atomicWriteTrigger(triggerPath, reopenedTrigger);
    return reopenedTrigger;
  }

  // Existing open or acknowledged trigger — update with latest data
  const updatedTrigger: ReplanTrigger = {
    ...existingTrigger,
    last_evaluated_at: now,
    constraint: {
      constraint_key: constraintKey,
      stage: latestBottleneck.constraint_stage ?? "",
      metric: latestBottleneck.constraint_metric,
      severity: constraintSeverity,
    },
    run_history: runHistory,
    non_persistent_count: 0,
  };

  atomicWriteTrigger(triggerPath, updatedTrigger);
  return updatedTrigger;
}
