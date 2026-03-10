/**
 * BL-06: Guarded replan trigger with severity gate and lifecycle state
 *
 * Evaluates constraint persistence + severity gate after each diagnosis and
 * manages replan trigger lifecycle (open → acknowledged → resolved → reopen).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { checkConstraintPersistence, getRecentBottlenecks } from "./diagnostics/bottleneck-history";
import { type DiagnosisSnapshot } from "./diagnostics/diagnosis-snapshot";
import type { GapCase, Prescription } from "./self-evolving/self-evolving-contracts.js";
import {
  buildCanonicalGapCase,
  buildCanonicalPrescription,
  buildCompiledCandidateId,
  expectedArtifactsForRoute,
  normalizeCanonicalToken,
  severityScoreFromLabel,
} from "./self-evolving/self-evolving-prescription-normalization.js";

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
  gap_case?: GapCase;
  prescription?: Prescription;
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
  return getPrescriptionBlueprint(constraintKey).focus;
}

function getPrescriptionBlueprint(constraintKey: string): {
  prescription_family: string;
  focus: string;
  required_route: "lp-do-fact-find";
  risk_class: "low" | "medium";
} {
  // SIGNALS-01/cvr (legacy S3/cvr) → conversion optimization
  if (constraintKey === "SIGNALS-01/cvr" || constraintKey === "S3/cvr") {
    return {
      prescription_family: "conversion_optimization_review",
      focus: "Improve conversion rate through offer clarity, trust signals, or checkout optimization",
      required_route: "lp-do-fact-find",
      risk_class: "medium",
    };
  }

  // SELL-01/traffic → traffic acquisition
  if (constraintKey === "SELL-01/traffic") {
    return {
      prescription_family: "traffic_acquisition_review",
      focus: "Increase traffic through SEO, paid acquisition, or content marketing",
      required_route: "lp-do-fact-find",
      risk_class: "medium",
    };
  }

  // SELL-01/cac → cost optimization
  if (constraintKey === "SELL-01/cac") {
    return {
      prescription_family: "acquisition_cost_optimization_review",
      focus: "Reduce customer acquisition cost through channel optimization or targeting",
      required_route: "lp-do-fact-find",
      risk_class: "medium",
    };
  }

  // MARKET-06/aov → AOV optimization (MARKET-06/aov retained for legacy runs)
  if (constraintKey === "MARKET-06/aov" || constraintKey === "MARKET-06/aov") {
    return {
      prescription_family: "average_order_value_optimization_review",
      focus: "Increase average order value through upsells, bundles, or pricing",
      required_route: "lp-do-fact-find",
      risk_class: "medium",
    };
  }

  // Any stage_blocked → blocker resolution
  if (constraintKey.includes("stage_blocked")) {
    return {
      prescription_family: "blocker_resolution_review",
      focus: "Resolve stage blocker before addressing metric constraints",
      required_route: "lp-do-fact-find",
      risk_class: "low",
    };
  }

  // Default
  return {
    prescription_family: "targeted_intervention_review",
    focus: "Review constraint and plan targeted intervention",
    required_route: "lp-do-fact-find",
    risk_class: "low",
  };
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

function buildConstraintGapType(constraintKey: string, metric: string | null): string {
  if (constraintKey.includes("stage_blocked")) {
    return "bottleneck_stage_blocked";
  }
  if (metric && metric.trim().length > 0) {
    return `bottleneck_metric_${normalizeCanonicalToken(metric)}`;
  }
  return `bottleneck_${normalizeCanonicalToken(constraintKey)}`;
}

function buildCanonicalReplanFields(input: {
  business: string;
  trigger: Pick<ReplanTrigger, "constraint" | "recommended_focus" | "reason" | "persistence_threshold">;
  minSeverity: string;
}): { gap_case: GapCase; prescription: Prescription } {
  const constraintKey = input.trigger.constraint.constraint_key;
  const stageId =
    typeof input.trigger.constraint.stage === "string" && input.trigger.constraint.stage.length > 0
      ? input.trigger.constraint.stage
      : null;
  const metric =
    typeof input.trigger.constraint.metric === "string" && input.trigger.constraint.metric.length > 0
      ? input.trigger.constraint.metric
      : null;
  const gapType = buildConstraintGapType(constraintKey, metric);
  const candidateId = buildCompiledCandidateId({
    business_id: input.business,
    source_kind: "bottleneck",
    recurrence_key: constraintKey,
    gap_type: gapType,
    stage_id: stageId,
  });
  const blueprint = getPrescriptionBlueprint(constraintKey);

  return {
    gap_case: buildCanonicalGapCase({
      business_id: input.business,
      source_kind: "bottleneck",
      stage_id: stageId,
      capability_id: null,
      gap_type: gapType,
      reason_code: normalizeCanonicalToken(
        metric ? `persistent_metric_constraint_${metric}` : "persistent_stage_constraint",
      ),
      severity: severityScoreFromLabel(input.trigger.constraint.severity),
      evidence_refs: [`docs/business-os/startup-baselines/${input.business}/bottleneck-history.jsonl`],
      recurrence_key: constraintKey,
      structural_context: {
        constraint_key: constraintKey,
        stage: stageId,
        metric,
        severity_label: input.trigger.constraint.severity,
        min_severity_gate: input.minSeverity,
        persistence_threshold: input.trigger.persistence_threshold,
        recommended_focus: input.trigger.recommended_focus,
        reason: input.trigger.reason,
      },
      candidate_id: candidateId,
    }),
    prescription: buildCanonicalPrescription({
      prescription_family: blueprint.prescription_family,
      source: "replan_trigger",
      gap_types_supported: [gapType],
      required_route: blueprint.required_route,
      required_inputs: [
        `docs/business-os/startup-baselines/${input.business}/bottleneck-history.jsonl`,
        constraintKey,
      ],
      expected_artifacts: expectedArtifactsForRoute(blueprint.required_route),
      expected_signal_change: `Reduce or resolve persistent bottleneck ${constraintKey} before it recurs again.`,
      risk_class: blueprint.risk_class,
    }),
  };
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
      const canonical = buildCanonicalReplanFields({
        business,
        trigger: resolvedTrigger,
        minSeverity: resolvedTrigger.min_severity,
      });
      resolvedTrigger.gap_case = canonical.gap_case;
      resolvedTrigger.prescription = canonical.prescription;

      atomicWriteTrigger(triggerPath, resolvedTrigger);
      return resolvedTrigger;
    }

    // Still open/acknowledged, just update eval time and count
    const updatedTrigger: ReplanTrigger = {
      ...existingTrigger,
      last_evaluated_at: new Date().toISOString(),
      non_persistent_count: nonPersistentCount,
    };
    const canonical = buildCanonicalReplanFields({
      business,
      trigger: updatedTrigger,
      minSeverity: updatedTrigger.min_severity,
    });
    updatedTrigger.gap_case = canonical.gap_case;
    updatedTrigger.prescription = canonical.prescription;

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
      const canonical = buildCanonicalReplanFields({
        business,
        trigger: updatedTrigger,
        minSeverity,
      });
      updatedTrigger.gap_case = canonical.gap_case;
      updatedTrigger.prescription = canonical.prescription;

      atomicWriteTrigger(triggerPath, updatedTrigger);
      return updatedTrigger;
    }

    return null;
  }

  // Step 5: Severity gate passed — handle trigger creation/update/reopen
  const runHistory = recentBottlenecks.map((b) => b.run_id);
  const now = new Date().toISOString();

  if (!existingTrigger) {
    const recommendedFocus = getRecommendedFocus(constraintKey);
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
      recommended_focus: recommendedFocus,
      min_severity: minSeverity,
      persistence_threshold: persistenceThreshold,
      non_persistent_count: 0,
    };
    const canonical = buildCanonicalReplanFields({
      business,
      trigger: newTrigger,
      minSeverity,
    });
    newTrigger.gap_case = canonical.gap_case;
    newTrigger.prescription = canonical.prescription;

    atomicWriteTrigger(triggerPath, newTrigger);
    return newTrigger;
  }

  if (existingTrigger.status === "resolved") {
    const recommendedFocus = getRecommendedFocus(constraintKey);
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
      recommended_focus: recommendedFocus,
      non_persistent_count: 0,
    };
    const canonical = buildCanonicalReplanFields({
      business,
      trigger: reopenedTrigger,
      minSeverity,
    });
    reopenedTrigger.gap_case = canonical.gap_case;
    reopenedTrigger.prescription = canonical.prescription;

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
  const canonical = buildCanonicalReplanFields({
    business,
    trigger: updatedTrigger,
    minSeverity,
  });
  updatedTrigger.gap_case = canonical.gap_case;
  updatedTrigger.prescription = canonical.prescription;

  atomicWriteTrigger(triggerPath, updatedTrigger);
  return updatedTrigger;
}
