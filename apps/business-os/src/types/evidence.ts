import { z } from "zod";

/**
 * Evidence source types for Business OS
 * BOS-26: Evidence source typing system
 *
 * These types classify the origin and nature of evidence used in
 * decision-making, risk assessment, and lane transition validation.
 */
export const EvidenceSourceType = {
  /** Quantitative measurement (metrics, analytics, performance data) */
  measurement: "measurement",
  /** Direct input from customers (interviews, surveys, support tickets) */
  "customer-input": "customer-input",
  /** Code changes (git diffs, PR reviews, commit history) */
  "repo-diff": "repo-diff",
  /** Controlled experiment (A/B test, feature flag rollout) */
  experiment: "experiment",
  /** Financial analysis (revenue projections, cost models, ROI calculations) */
  "financial-model": "financial-model",
  /** Third-party vendor quote or proposal */
  "vendor-quote": "vendor-quote",
  /** Legal guidance, compliance requirement, or contract term */
  legal: "legal",
  /** Stated assumption (must be validated or deprecated) */
  assumption: "assumption",
  /** Other evidence type (should specify in notes) */
  other: "other",
} as const;

export type EvidenceSourceType =
  (typeof EvidenceSourceType)[keyof typeof EvidenceSourceType];

/** Array of all valid evidence source type values */
export const evidenceSourceTypes = Object.values(
  EvidenceSourceType
) as EvidenceSourceType[];

/** Zod schema for evidence source type validation */
export const evidenceSourceTypeSchema = z.enum([
  "measurement",
  "customer-input",
  "repo-diff",
  "experiment",
  "financial-model",
  "vendor-quote",
  "legal",
  "assumption",
  "other",
]);

/** Evidence entry with source type and description */
export interface EvidenceEntry {
  /** Source type classification */
  sourceType: EvidenceSourceType;
  /** Brief description of the evidence */
  description: string;
  /** Optional link to detailed evidence (file, URL, commit SHA) */
  link?: string;
  /** Optional date when evidence was gathered */
  date?: string;
}

/** Zod schema for evidence entry validation */
export const evidenceEntrySchema = z.object({
  sourceType: evidenceSourceTypeSchema,
  description: z.string().min(1, "Evidence description is required"),
  link: z.string().url().optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Get human-readable label for evidence source type
 */
export function getEvidenceSourceLabel(type: EvidenceSourceType): string {
  const labels: Record<EvidenceSourceType, string> = {
    measurement: "Measurement",
    "customer-input": "Customer Input",
    "repo-diff": "Code Changes",
    experiment: "Experiment",
    "financial-model": "Financial Model",
    "vendor-quote": "Vendor Quote",
    legal: "Legal",
    assumption: "Assumption",
    other: "Other",
  };
  return labels[type] || type;
}

/**
 * Get color classification for evidence source type (for UI badges)
 */
export function getEvidenceSourceColor(
  type: EvidenceSourceType
): "green" | "blue" | "yellow" | "gray" {
  switch (type) {
    case "measurement":
    case "experiment":
    case "repo-diff":
      return "green"; // High confidence
    case "customer-input":
    case "financial-model":
    case "vendor-quote":
    case "legal":
      return "blue"; // Medium-high confidence
    case "assumption":
      return "yellow"; // Needs validation
    case "other":
    default:
      return "gray"; // Unknown
  }
}
