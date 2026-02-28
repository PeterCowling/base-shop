import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import {
  isTaskComplete,
  parseConfidencePercent,
  parseTaskBlocks,
  parseTaskIdList,
} from "./markdown.js";

export type TaskType = "IMPLEMENT" | "SPIKE" | "INVESTIGATE" | "CHECKPOINT";
export type TaskSize = "S" | "M" | "L";
export type ValidationCoverage = "complete" | "partial" | "none";
export type ExecutionTrack = "code" | "business-artifact" | "mixed";

export interface ConfidenceInput {
  type: string;
  confidence: number;
  size?: TaskSize;
  evidenceClass?: string;
  vcCoverage?: ValidationCoverage;
  track?: ExecutionTrack;
  redEvidence?: boolean;
  greenEvidence?: boolean;
  refactorEvidence?: boolean;
}

export interface ConfidenceValidationResult {
  eligible: boolean;
  threshold: number | null;
  normalizedConfidence: number;
  cappedAt?: number;
  reasons: string[];
  violations: string[];
}

interface ThresholdConfig {
  thresholds: {
    implement: number;
    spike: number;
    investigate: number;
    replan_trigger: number;
  };
  caps: {
    reasoning_only_ml: number;
    incomplete_validation_contract: number;
    business_fail_first: {
      no_red: number;
      red_no_green: number;
      green_no_refactor: number;
    };
  };
  rules: {
    confidence_step: number;
    exact_threshold_flag: number;
  };
}

export interface PlanTaskEligibilityResult {
  taskId: string;
  found: boolean;
  eligible: boolean;
  reason: string;
  confidenceResult?: ConfidenceValidationResult;
  blockedBy: string[];
}

let cachedConfig: ThresholdConfig | null = null;

export function validateTaskConfidence(input: ConfidenceInput): ConfidenceValidationResult {
  const config = getThresholdConfig();
  const type = normalizeTaskType(input.type);
  const reasons: string[] = [];
  const violations: string[] = [];
  const threshold = getThresholdForType(type, config);

  if (!Number.isFinite(input.confidence)) {
    return {
      eligible: false,
      threshold,
      normalizedConfidence: 0,
      reasons: ["Confidence is not a finite number."],
      violations: ["invalid-confidence"],
    };
  }

  let normalizedConfidence = clamp(Math.round(input.confidence), 0, 100);
  if (normalizedConfidence % config.rules.confidence_step !== 0) {
    violations.push(
      `confidence-not-multiple-of-${config.rules.confidence_step}`,
    );
  }

  const capResult = applyConfidenceCaps(input, config);
  reasons.push(...capResult.reasons);
  const vcCoverage = capResult.vcCoverage;
  const cappedAt = capResult.cappedAt;

  if (cappedAt !== undefined) {
    normalizedConfidence = Math.min(normalizedConfidence, cappedAt);
  }

  if (normalizedConfidence > config.thresholds.implement && vcCoverage !== "complete") {
    violations.push("confidence-above-80-without-complete-vc");
  }

  if (normalizedConfidence === config.rules.exact_threshold_flag) {
    reasons.push("Exact-threshold red flag at 80: held-back test required.");
  }

  const eligibility = evaluateEligibility(
    type,
    input.type,
    threshold,
    normalizedConfidence,
  );
  reasons.push(...eligibility.reasons);
  violations.push(...eligibility.violations);

  return {
    eligible: eligibility.eligible,
    threshold,
    normalizedConfidence,
    cappedAt,
    reasons,
    violations,
  };
}

export function validatePlanTaskBuildEligibility(
  planMarkdown: string,
  taskId: string,
): PlanTaskEligibilityResult {
  const allTasks = parseTaskBlocks(planMarkdown);
  const taskMap = new Map(allTasks.map((task) => [task.id, task]));
  const target = taskMap.get(taskId);
  if (!target) {
    return {
      taskId,
      found: false,
      eligible: false,
      reason: `Task ${taskId} not found in plan.`,
      blockedBy: [],
    };
  }

  const dependsOn = parseTaskIdList(target.fields["depends-on"] ?? "-");
  const blockedBy = dependsOn.filter((depId) => {
    const depTask = taskMap.get(depId);
    return !depTask || !isTaskComplete(depTask.fields["status"]);
  });
  if (blockedBy.length > 0) {
    return {
      taskId,
      found: true,
      eligible: false,
      reason: `Dependencies incomplete: ${blockedBy.join(", ")}`,
      blockedBy,
    };
  }

  const confidence = parseConfidencePercent(target.fields["confidence"]);
  if (confidence === null) {
    return {
      taskId,
      found: true,
      eligible: false,
      reason: "Task confidence is missing or unparseable.",
      blockedBy: [],
    };
  }

  const confidenceResult = validateTaskConfidence({
    type: target.fields["type"] ?? "UNKNOWN",
    confidence,
    size: parseEffort(target.fields["effort"]),
    evidenceClass: target.fields["evidence-class"] ?? "",
    vcCoverage: inferCoverage(target.raw),
    track: parseTrack(target.fields["execution-track"]),
    redEvidence: hasEvidenceMarker(target.raw, "red evidence"),
    greenEvidence: hasEvidenceMarker(target.raw, "green evidence"),
    refactorEvidence: hasEvidenceMarker(target.raw, "refactor evidence"),
  });

  return {
    taskId,
    found: true,
    eligible: confidenceResult.eligible,
    reason: confidenceResult.reasons.join(" "),
    blockedBy: [],
    confidenceResult,
  };
}

function getThresholdConfig(): ThresholdConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const yamlPath = path.join(currentDir, "confidence-thresholds.yaml");
  const parsed = yaml.load(readFileSync(yamlPath, "utf8")) as unknown;
  if (!isThresholdConfig(parsed)) {
    throw new Error(`Invalid confidence threshold config at ${yamlPath}`);
  }
  cachedConfig = parsed;
  return parsed;
}

function getThresholdForType(
  type: ReturnType<typeof normalizeTaskType>,
  config: ThresholdConfig,
): number | null {
  switch (type) {
    case "IMPLEMENT":
      return config.thresholds.implement;
    case "SPIKE":
      return config.thresholds.spike;
    case "INVESTIGATE":
      return config.thresholds.investigate;
    case "CHECKPOINT":
      return null;
    default:
      return null;
  }
}

function normalizeTaskType(rawType: string): TaskType | "UNKNOWN" {
  const normalized = rawType.trim().toUpperCase();
  if (
    normalized === "IMPLEMENT" ||
    normalized === "SPIKE" ||
    normalized === "INVESTIGATE" ||
    normalized === "CHECKPOINT"
  ) {
    return normalized;
  }
  return "UNKNOWN";
}

function parseEffort(value: string | undefined): TaskSize | undefined {
  const normalized = (value ?? "").trim().toUpperCase();
  if (normalized === "S" || normalized === "M" || normalized === "L") {
    return normalized;
  }
  return undefined;
}

function parseTrack(value: string | undefined): ExecutionTrack {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "business-artifact" || normalized === "mixed") {
    return normalized;
  }
  return "code";
}

function inferCoverage(taskBody: string): ValidationCoverage {
  const lower = taskBody.toLowerCase();
  if (lower.includes("validation contract") && lower.match(/\b(tc|vc)-\d+/i)) {
    return "complete";
  }
  if (lower.includes("validation contract")) {
    return "partial";
  }
  return "none";
}

function hasEvidenceMarker(taskBody: string, marker: string): boolean {
  return taskBody.toLowerCase().includes(marker.toLowerCase());
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isThresholdConfig(value: unknown): value is ThresholdConfig {
  if (!value || typeof value !== "object") {
    return false;
  }
  const requiredNumericPaths = [
    "thresholds.implement",
    "thresholds.spike",
    "thresholds.investigate",
    "thresholds.replan_trigger",
    "caps.reasoning_only_ml",
    "caps.incomplete_validation_contract",
    "caps.business_fail_first.no_red",
    "caps.business_fail_first.red_no_green",
    "caps.business_fail_first.green_no_refactor",
    "rules.confidence_step",
    "rules.exact_threshold_flag",
  ];
  return requiredNumericPaths.every((pathKey) =>
    hasNumericPath(value as Record<string, unknown>, pathKey),
  );
}

function applyConfidenceCaps(
  input: ConfidenceInput,
  config: ThresholdConfig,
): { cappedAt?: number; reasons: string[]; vcCoverage: ValidationCoverage } {
  const reasons: string[] = [];
  let cappedAt: number | undefined;
  const vcCoverage = (input.vcCoverage ?? "none").toLowerCase() as ValidationCoverage;
  const track = (input.track ?? "code").toLowerCase() as ExecutionTrack;
  const evidenceClass = (input.evidenceClass ?? "").trim().toLowerCase();

  const applyCap = (capValue: number, reason: string): void => {
    if (cappedAt === undefined || capValue < cappedAt) {
      cappedAt = capValue;
    }
    reasons.push(reason);
  };

  if (
    (input.size === "M" || input.size === "L") &&
    (evidenceClass === "reasoning-only" || evidenceClass === "reasoning only")
  ) {
    applyCap(
      config.caps.reasoning_only_ml,
      "M/L task with reasoning-only evidence is capped.",
    );
  }

  if (vcCoverage !== "complete") {
    applyCap(
      config.caps.incomplete_validation_contract,
      "Incomplete validation contract is capped.",
    );
  }

  if (track === "business-artifact" || track === "mixed") {
    const businessCap = getBusinessFailFirstCap(input, config);
    if (businessCap) {
      applyCap(businessCap.cap, businessCap.reason);
    }
  }

  return { cappedAt, reasons, vcCoverage };
}

function getBusinessFailFirstCap(
  input: ConfidenceInput,
  config: ThresholdConfig,
): { cap: number; reason: string } | null {
  if (!input.redEvidence) {
    return {
      cap: config.caps.business_fail_first.no_red,
      reason: "Business fail-first cap applied: no Red evidence.",
    };
  }
  if (!input.greenEvidence) {
    return {
      cap: config.caps.business_fail_first.red_no_green,
      reason: "Business fail-first cap applied: Red present, Green missing.",
    };
  }
  if (!input.refactorEvidence) {
    return {
      cap: config.caps.business_fail_first.green_no_refactor,
      reason: "Business fail-first cap applied: Refactor evidence missing.",
    };
  }
  return null;
}

function evaluateEligibility(
  type: TaskType | "UNKNOWN",
  rawType: string,
  threshold: number | null,
  confidence: number,
): { eligible: boolean; reasons: string[]; violations: string[] } {
  if (type === "UNKNOWN") {
    return {
      eligible: false,
      reasons: [`Unknown task type: ${rawType}`],
      violations: ["unknown-task-type"],
    };
  }
  if (type === "CHECKPOINT") {
    return {
      eligible: true,
      reasons: ["CHECKPOINT tasks are procedural and always eligible."],
      violations: [],
    };
  }
  if (threshold !== null && confidence < threshold) {
    return {
      eligible: false,
      reasons: [
        `Confidence ${confidence}% is below required ${threshold}% threshold.`,
      ],
      violations: [],
    };
  }
  return {
    eligible: true,
    reasons: [],
    violations: [],
  };
}

function hasNumericPath(root: Record<string, unknown>, dottedPath: string): boolean {
  const parts = dottedPath.split(".");
  let cursor: unknown = root;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) {
      return false;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return typeof cursor === "number";
}
