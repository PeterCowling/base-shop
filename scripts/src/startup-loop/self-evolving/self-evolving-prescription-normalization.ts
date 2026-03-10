import {
  type CanonicalRecommendedRoute,
  type GapCase,
  type GapCaseSourceKind,
  type Prescription,
  type PrescriptionRiskClass,
  type PrescriptionSourceKind,
  stableHash,
  validateGapCase,
  validatePrescription,
} from "./self-evolving-contracts.js";

interface CompiledCandidateSeed {
  business_id: string;
  source_kind: GapCaseSourceKind;
  recurrence_key: string;
  gap_type: string;
  stage_id?: string | null;
  capability_id?: string | null;
}

interface GapCaseInput {
  business_id: string;
  source_kind: GapCaseSourceKind;
  stage_id?: string | null;
  capability_id?: string | null;
  gap_type: string;
  reason_code: string;
  severity: number;
  evidence_refs: string[];
  recurrence_key: string;
  structural_context: Record<string, unknown>;
  candidate_id: string;
}

interface PrescriptionInput {
  prescription_family: string;
  source: PrescriptionSourceKind;
  gap_types_supported: string[];
  required_route: CanonicalRecommendedRoute;
  required_inputs: string[];
  expected_artifacts: string[];
  expected_signal_change: string;
  risk_class: PrescriptionRiskClass;
}

function compactStableId(prefix: string, key: string): string {
  return `${prefix}-${stableHash(key).slice(0, 16)}`;
}

function filterStringList(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function clampSeverity(severity: number): number {
  if (Number.isNaN(severity)) {
    return 0;
  }
  return Math.max(0, Math.min(1, severity));
}

function assertValid(errors: readonly string[], label: string): void {
  if (errors.length > 0) {
    throw new Error(`Invalid ${label}: ${errors.join(", ")}`);
  }
}

export function normalizeCanonicalToken(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return normalized.length > 0 ? normalized : "unknown";
}

export function buildCompiledCandidateId(seed: CompiledCandidateSeed): string {
  return compactStableId(
    "cand",
    [
      seed.business_id,
      seed.source_kind,
      seed.recurrence_key,
      seed.gap_type,
      seed.stage_id ?? "none",
      seed.capability_id ?? "none",
    ].join("|"),
  );
}

export function expectedArtifactsForRoute(route: CanonicalRecommendedRoute): string[] {
  switch (route) {
    case "lp-do-fact-find":
      return ["fact-find.md"];
    case "lp-do-plan":
      return ["plan.md"];
    case "lp-do-build":
      return ["build-record.user.md"];
    case "lp-do-briefing":
      return ["briefing.md"];
  }
}

export function severityScoreFromLabel(label: string): number {
  switch (normalizeCanonicalToken(label)) {
    case "critical":
      return 0.9;
    case "moderate":
      return 0.65;
    case "minor":
      return 0.35;
    case "none":
      return 0.1;
    default:
      return 0.5;
  }
}

export function buildCanonicalGapCase(input: GapCaseInput): GapCase {
  const gapCase: GapCase = {
    schema_version: "gap-case.v1",
    gap_case_id: compactStableId(
      "gap",
      [
        input.business_id,
        input.source_kind,
        input.recurrence_key,
        input.gap_type,
        input.reason_code,
        input.stage_id ?? "none",
        input.capability_id ?? "none",
      ].join("|"),
    ),
    source_kind: input.source_kind,
    business_id: input.business_id,
    stage_id: input.stage_id ?? null,
    capability_id: input.capability_id ?? null,
    gap_type: input.gap_type,
    reason_code: input.reason_code,
    severity: clampSeverity(input.severity),
    evidence_refs: filterStringList(input.evidence_refs),
    recurrence_key: input.recurrence_key,
    structural_context: input.structural_context,
    runtime_binding: {
      binding_mode: "compiled_to_candidate",
      candidate_id: input.candidate_id,
    },
  };
  assertValid(validateGapCase(gapCase), "gap_case");
  return gapCase;
}

export function buildCanonicalPrescription(input: PrescriptionInput): Prescription {
  const prescription: Prescription = {
    schema_version: "prescription.v1",
    prescription_id: compactStableId(
      "rx",
      [
        input.source,
        input.prescription_family,
        input.required_route,
        ...filterStringList(input.gap_types_supported),
      ].join("|"),
    ),
    prescription_family: input.prescription_family,
    source: input.source,
    gap_types_supported: filterStringList(input.gap_types_supported),
    required_route: input.required_route,
    required_inputs: filterStringList(input.required_inputs),
    expected_artifacts: filterStringList(input.expected_artifacts),
    expected_signal_change: input.expected_signal_change.trim(),
    risk_class: input.risk_class,
  };
  assertValid(validatePrescription(prescription), "prescription");
  return prescription;
}
