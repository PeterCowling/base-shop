import { isNonePlaceholderIdeaCandidate } from "../build/lp-do-build-results-review-parse.js";

import { DEFAULT_MATURE_BOUNDARY_SIGNALS } from "./self-evolving-boundary.js";
import type {
  BoundarySignalSource,
  CandidateType,
  ExecutorDomainHint,
  MetaObservation,
  ObservationSignalHints,
  StartupState,
} from "./self-evolving-contracts.js";

const NORMALIZE_SEPARATOR_PATTERN = /[:;,.()[\]{}!?/\\|"'`]+/g;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function uniqueTexts(
  values: readonly (string | null | undefined)[],
): string[] {
  return [
    ...new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ];
}

export function normalizeSignalText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[|]/g, " ")
    .replace(/[^\w\s:-]+/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(NORMALIZE_SEPARATOR_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isNonePlaceholderSignal(value: string): boolean {
  return isNonePlaceholderIdeaCandidate(value);
}

function extractBuildOutputIdeaLabel(contextPath: string): string | null {
  const marker = "/idea:";
  const index = contextPath.indexOf(marker);
  if (index < 0) {
    return null;
  }
  const label = contextPath.slice(index + marker.length).trim();
  return label.length > 0 ? label : null;
}

function extractBuildOutputProblemSubject(problemStatement: string): string | null {
  const match = problemStatement.match(
    /^Reduce recurring build-output idea work for\s+(.+?)\.\s*$/i,
  );
  if (!match?.[1]) {
    return null;
  }
  const subject = match[1].trim();
  return subject.length > 0 ? subject : null;
}

export function isNonePlaceholderMetaObservation(
  observation: MetaObservation,
): boolean {
  const contextLabel = extractBuildOutputIdeaLabel(observation.context_path);
  if (contextLabel && isNonePlaceholderIdeaCandidate(contextLabel)) {
    return true;
  }

  const problemSubject = extractBuildOutputProblemSubject(
    observation.signal_hints?.problem_statement ?? "",
  );
  if (problemSubject && isNonePlaceholderIdeaCandidate(problemSubject)) {
    return true;
  }

  const recurrenceKey = observation.signal_hints?.recurrence_key;
  if (recurrenceKey && isNonePlaceholderIdeaCandidate(recurrenceKey.replace(/\|/g, " "))) {
    return true;
  }

  return false;
}

function matchesAny(texts: readonly string[], patterns: readonly RegExp[]): boolean {
  return texts.some((text) => patterns.some((pattern) => pattern.test(text)));
}

export function inferCandidateTypeFromTexts(
  values: readonly string[],
): CandidateType {
  const texts = uniqueTexts(values).map(normalizeSignalText);
  if (
    matchesAny(texts, [
      /\bnew skill\b/,
      /\bcreate skill\b/,
      /\badd skill\b/,
      /\bskill proposal\b/,
    ])
  ) {
    return "new_skill";
  }
  if (
    matchesAny(texts, [
      /\brefactor\b/,
      /\brewrite\b/,
      /\bupdate skill\b/,
      /\bworkflow\b/,
      /\bplaybook\b/,
      /\bprompt\b/,
    ])
  ) {
    return "skill_refactor";
  }
  if (
    matchesAny(texts, [
      /\bdeterministic\b/,
      /\bextract/i,
      /\bnormalize\b/,
      /\bcanonical/i,
      /\bschema\b/,
      /\btelemetry\b/,
      /\breport\b/,
      /\blint\b/,
      /\bvalidator\b/,
      /\bdata source\b/,
      /\binstrumentation\b/,
    ])
  ) {
    return "deterministic_extraction";
  }
  return "container_update";
}

export function inferExecutorDomainFromTexts(
  values: readonly string[],
): ExecutorDomainHint {
  const texts = uniqueTexts(values).map(normalizeSignalText);
  if (
    matchesAny(texts, [
      /\bwebsite\b/,
      /\blegal\b/,
      /\bterms\b/,
      /\bcheckout\b/,
      /\bseo\b/,
      /\bcontent\b/,
      /\bpdp\b/,
      /\blanding page\b/,
    ])
  ) {
    return "website";
  }
  if (
    matchesAny(texts, [
      /\boffer\b/,
      /\bpricing\b/,
      /\bicp\b/,
      /\bpositioning\b/,
    ])
  ) {
    return "offer";
  }
  if (
    matchesAny(texts, [
      /\bdistribution\b/,
      /\bchannel\b/,
      /\bgtm\b/,
      /\bacquisition\b/,
      /\boutreach\b/,
      /\bpartnership\b/,
    ])
  ) {
    return "distribution";
  }
  if (
    matchesAny(texts, [
      /\bactivation\b/,
      /\bonboarding\b/,
      /\bsignup\b/,
      /\blead\b/,
      /\bconversion\b/,
    ])
  ) {
    return "activation";
  }
  if (
    matchesAny(texts, [
      /\bfeedback\b/,
      /\breview\b/,
      /\bsupport\b/,
      /\bvoice of customer\b/,
    ])
  ) {
    return "feedback";
  }
  if (
    matchesAny(texts, [
      /\bexperiment\b/,
      /\bvariant\b/,
      /\btest\b/,
      /\bcanary\b/,
    ])
  ) {
    return "experiment";
  }
  return "analytics";
}

export function buildObservationSignalHints(input: {
  recurrenceKeyParts: readonly string[];
  problemStatement?: string | null;
  texts?: readonly string[];
  candidateTypeHint?: CandidateType | null;
  executorDomainHint?: ExecutorDomainHint | null;
  executorPathHint?: string | null;
}): ObservationSignalHints {
  const texts = uniqueTexts(input.texts ?? []);
  const normalizedRecurrenceParts = uniqueTexts(input.recurrenceKeyParts)
    .map(normalizeSignalText)
    .filter((value) => value.length > 0);
  const recurrenceKey =
    normalizedRecurrenceParts.length > 0 ? normalizedRecurrenceParts.join("|") : null;

  return {
    recurrence_key: recurrenceKey,
    problem_statement:
      input.problemStatement?.trim().length ? input.problemStatement.trim() : null,
    candidate_type_hint:
      input.candidateTypeHint ?? inferCandidateTypeFromTexts(texts),
    executor_domain_hint:
      input.executorDomainHint ?? inferExecutorDomainFromTexts(texts),
    executor_path_hint:
      input.executorPathHint?.trim().length ? input.executorPathHint.trim() : null,
  };
}

function inferWebsiteExecutorPath(startupState: StartupState): string {
  const generation =
    Number.isInteger(startupState.current_website_generation) &&
    startupState.current_website_generation > 0
      ? startupState.current_website_generation
      : startupState.stage === "prelaunch"
        ? 1
        : startupState.stage === "launched"
          ? 2
          : 3;

  if (generation >= 3) return "lp-do-build:container:website-v3";
  if (generation === 2) return "lp-do-build:container:website-v2";
  return "lp-do-build:container:website-v1";
}

export function inferCandidateTypeFromObservations(
  observations: readonly MetaObservation[],
): CandidateType {
  const hintedType = observations
    .map((observation) => observation.signal_hints?.candidate_type_hint)
    .find((value): value is CandidateType => typeof value === "string");
  if (hintedType) {
    return hintedType;
  }
  const texts = observations.flatMap((observation) => [
    observation.context_path,
    observation.signal_hints?.problem_statement ?? "",
    observation.signal_hints?.recurrence_key ?? "",
  ]);
  return inferCandidateTypeFromTexts(texts);
}

export function inferExecutorPathFromObservations(
  observations: readonly MetaObservation[],
  startupState: StartupState,
): string {
  const explicitPath = observations
    .map((observation) => observation.signal_hints?.executor_path_hint)
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (explicitPath) {
    return explicitPath;
  }

  const hintedDomain = observations
    .map((observation) => observation.signal_hints?.executor_domain_hint)
    .find((value): value is ExecutorDomainHint => typeof value === "string");
  const fallbackTexts = observations.flatMap((observation) => [
    observation.context_path,
    observation.signal_hints?.problem_statement ?? "",
    observation.signal_hints?.recurrence_key ?? "",
  ]);
  const executorDomain = hintedDomain ?? inferExecutorDomainFromTexts(fallbackTexts);

  switch (executorDomain) {
    case "website":
      return inferWebsiteExecutorPath(startupState);
    case "offer":
      return "lp-do-build:container:offer-v1";
    case "distribution":
      return "lp-do-build:container:distribution-sprint-v1";
    case "activation":
      return "lp-do-build:container:activation-loop-v1";
    case "feedback":
      return "lp-do-build:container:feedback-intel-v1";
    case "experiment":
      return "lp-do-build:container:experiment-cycle-v1";
    case "analytics":
    default:
      return "lp-do-build:container:analytics-v1";
  }
}

export function buildRepeatProblemStatement(
  observations: readonly MetaObservation[],
  recurrenceCount: number,
  fallbackSignature: string,
): string {
  const hinted = observations
    .map((observation) => observation.signal_hints?.problem_statement)
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (hinted) {
    return `${hinted} Recurred ${recurrenceCount} times in the active detector window.`;
  }

  const recurrenceKey = observations
    .map((observation) => observation.signal_hints?.recurrence_key)
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (recurrenceKey) {
    return `Repeated work detected for ${recurrenceKey}. Recurred ${recurrenceCount} times in the active detector window.`;
  }

  return `Repeated work signature ${fallbackSignature.slice(0, 8)} detected ${recurrenceCount} times in the active detector window.`;
}

export function deriveBoundarySignalsFromStartupState(
  startupState: StartupState | null | undefined,
): {
  monthly_revenue: number;
  headcount: number;
  support_ticket_volume_per_week: number;
  multi_region_compliance_flag: boolean;
  operational_complexity_score: number;
} {
  return deriveBoundarySignalSnapshotFromStartupState(startupState).signals;
}

export function deriveBoundarySignalSnapshotFromStartupState(
  startupState: StartupState | null | undefined,
): {
  signals: {
    monthly_revenue: number;
    headcount: number;
    support_ticket_volume_per_week: number;
    multi_region_compliance_flag: boolean;
    operational_complexity_score: number;
  };
  sources: {
    monthly_revenue: BoundarySignalSource;
    headcount: BoundarySignalSource;
    support_ticket_volume_per_week: BoundarySignalSource;
    multi_region_compliance_flag: BoundarySignalSource;
    operational_complexity_score: BoundarySignalSource;
  };
} {
  if (!startupState) {
    return {
      signals: DEFAULT_MATURE_BOUNDARY_SIGNALS,
      sources: {
        monthly_revenue: "unknown",
        headcount: "unknown",
        support_ticket_volume_per_week: "unknown",
        multi_region_compliance_flag: "unknown",
        operational_complexity_score: "unknown",
      },
    };
  }

  const override = startupState.mature_boundary_signals ?? {};
  const sourceOverride = startupState.mature_boundary_signal_sources ?? {};
  const channelCount = startupState.channels_enabled.length;
  const kpiCount = startupState.kpi_definitions.length;
  const assetCount = startupState.asset_refs.length;
  const constraintsText = startupState.constraints.join(" ");

  const monthlyRevenue =
    typeof override.monthly_revenue === "number"
      ? override.monthly_revenue
      : DEFAULT_MATURE_BOUNDARY_SIGNALS.monthly_revenue;
  const headcount =
    typeof override.headcount === "number"
      ? override.headcount
      : DEFAULT_MATURE_BOUNDARY_SIGNALS.headcount;
  const supportVolume =
    typeof override.support_ticket_volume_per_week === "number"
      ? override.support_ticket_volume_per_week
      : DEFAULT_MATURE_BOUNDARY_SIGNALS.support_ticket_volume_per_week;
  const multiRegionCompliance =
    typeof override.multi_region_compliance_flag === "boolean"
      ? override.multi_region_compliance_flag
      : /\bmulti[- ]region\b|\bgdpr\b|\bpci\b|\bvat\b|\btax\b|\bcompliance\b/i.test(
            constraintsText,
          );
  const operationalComplexityScore =
    typeof override.operational_complexity_score === "number"
      ? override.operational_complexity_score
      : clamp(
          1 +
            Math.max(0, startupState.current_website_generation - 1) +
            Math.min(2, Math.max(channelCount - 1, 0)) +
            Math.min(2, Math.max(kpiCount - 1, 0)) +
            Math.min(1, Math.max(assetCount - 1, 0)) +
            (multiRegionCompliance ? 1 : 0) +
            (startupState.stage === "traction" ? 1 : startupState.stage === "launched" ? 1 : 0),
          1,
          10,
        );

  return {
    signals: {
      monthly_revenue: monthlyRevenue,
      headcount,
      support_ticket_volume_per_week: supportVolume,
      multi_region_compliance_flag: multiRegionCompliance,
      operational_complexity_score: operationalComplexityScore,
    },
    sources: {
      monthly_revenue:
        sourceOverride.monthly_revenue ??
        (typeof override.monthly_revenue === "number" ? "measured" : "unknown"),
      headcount:
        sourceOverride.headcount ??
        (typeof override.headcount === "number" ? "measured" : "unknown"),
      support_ticket_volume_per_week:
        sourceOverride.support_ticket_volume_per_week ??
        (typeof override.support_ticket_volume_per_week === "number"
          ? "measured"
          : "unknown"),
      multi_region_compliance_flag:
        sourceOverride.multi_region_compliance_flag ??
        (typeof override.multi_region_compliance_flag === "boolean" ? "measured" : "inferred"),
      operational_complexity_score:
        sourceOverride.operational_complexity_score ??
        (typeof override.operational_complexity_score === "number" ? "measured" : "inferred"),
    },
  };
}
