import type {
  MeasurementContractStatus,
  MetaObservation,
  ObservationEvidenceGrade,
} from "./self-evolving-contracts.js";

const DEFAULT_MINIMUM_SAMPLE_SIZE = 30;

export interface ResolvedObservationEvidencePosture {
  grade: ObservationEvidenceGrade;
  measurement_contract_status: MeasurementContractStatus;
  source: "declared" | "inferred";
  has_baseline_ref: boolean;
  has_measurement_window: boolean;
  has_ok_data_quality: boolean;
  has_minimum_sample_size: boolean;
  has_measurement_ready_fields: boolean;
}

export interface ObservationPostureSummary {
  total_observations: number;
  effective_grade_counts: Record<ObservationEvidenceGrade, number>;
  declared_grade_counts: Record<ObservationEvidenceGrade, number> & {
    unlabeled: number;
  };
  measurement_contract_status_counts: Record<MeasurementContractStatus, number> & {
    unlabeled: number;
  };
  source_counts: {
    declared: number;
    inferred: number;
  };
  underlying_field_counts: {
    baseline_present: number;
    measurement_window_present: number;
    data_quality_ok: number;
    minimum_sample_ready: number;
    measurement_ready: number;
  };
  policy_eligibility_counts: {
    exploratory_fact_find_only: number;
    structural_fact_find_only: number;
    stronger_route_eligible_measured: number;
  };
  current_qualified_tranche: {
    measured_suffix_observations: number;
    stronger_route_eligible_now: boolean;
  };
}

export interface CandidateEvidencePosture {
  grade: ObservationEvidenceGrade;
  stronger_route_eligible: boolean;
  summary: ObservationPostureSummary;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasMinimumSampleSize(
  observation: MetaObservation,
  minimumSampleSize: number,
): boolean {
  return (
    typeof observation.sample_size === "number" &&
    observation.sample_size >= minimumSampleSize
  );
}

function compareObservationChronology(
  left: MetaObservation,
  right: MetaObservation,
): number {
  const leftMs = Date.parse(left.timestamp);
  const rightMs = Date.parse(right.timestamp);
  if (!Number.isNaN(leftMs) && !Number.isNaN(rightMs) && leftMs !== rightMs) {
    return leftMs - rightMs;
  }
  return left.observation_id.localeCompare(right.observation_id);
}

function countCurrentMeasuredSuffix(
  observations: readonly MetaObservation[],
  minimumSampleSize: number,
): number {
  const sorted = [...observations].sort(compareObservationChronology);
  let measuredSuffix = 0;

  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const posture = resolveObservationEvidencePosture(sorted[index], minimumSampleSize);
    if (posture.grade === "measured" && posture.has_measurement_ready_fields) {
      measuredSuffix += 1;
      continue;
    }
    break;
  }

  return measuredSuffix;
}

export function resolveObservationEvidencePosture(
  observation: MetaObservation,
  minimumSampleSize = DEFAULT_MINIMUM_SAMPLE_SIZE,
): ResolvedObservationEvidencePosture {
  const hasBaselineRef = hasText(observation.baseline_ref);
  const hasMeasurementWindow = hasText(observation.measurement_window);
  const hasOkDataQuality = observation.data_quality_status === "ok";
  const hasMinimumSample = hasMinimumSampleSize(observation, minimumSampleSize);
  const hasMeasurementReadyFields =
    hasBaselineRef &&
    hasMeasurementWindow &&
    hasOkDataQuality &&
    hasMinimumSample;
  const hasAnyMeasurementSignals =
    observation.kpi_name != null ||
    hasBaselineRef ||
    hasMeasurementWindow ||
    observation.data_quality_status !== null ||
    typeof observation.sample_size === "number";

  const declaredGrade = observation.evidence_grade;
  const declaredContract = observation.measurement_contract_status;
  if (
    (declaredGrade === "exploratory" ||
      declaredGrade === "structural" ||
      declaredGrade === "measured") &&
    (declaredContract === "none" ||
      declaredContract === "declared" ||
      declaredContract === "verified")
  ) {
    return {
      grade: declaredGrade,
      measurement_contract_status: declaredContract,
      source: "declared",
      has_baseline_ref: hasBaselineRef,
      has_measurement_window: hasMeasurementWindow,
      has_ok_data_quality: hasOkDataQuality,
      has_minimum_sample_size: hasMinimumSample,
      has_measurement_ready_fields: hasMeasurementReadyFields,
    };
  }

  if (hasMeasurementReadyFields) {
    return {
      grade: "measured",
      measurement_contract_status: "verified",
      source: "inferred",
      has_baseline_ref: hasBaselineRef,
      has_measurement_window: hasMeasurementWindow,
      has_ok_data_quality: hasOkDataQuality,
      has_minimum_sample_size: hasMinimumSample,
      has_measurement_ready_fields: hasMeasurementReadyFields,
    };
  }

  if (hasAnyMeasurementSignals) {
    return {
      grade: "structural",
      measurement_contract_status: "declared",
      source: "inferred",
      has_baseline_ref: hasBaselineRef,
      has_measurement_window: hasMeasurementWindow,
      has_ok_data_quality: hasOkDataQuality,
      has_minimum_sample_size: hasMinimumSample,
      has_measurement_ready_fields: hasMeasurementReadyFields,
    };
  }

  return {
    grade: "exploratory",
    measurement_contract_status: "none",
    source: "inferred",
    has_baseline_ref: hasBaselineRef,
    has_measurement_window: hasMeasurementWindow,
    has_ok_data_quality: hasOkDataQuality,
    has_minimum_sample_size: hasMinimumSample,
    has_measurement_ready_fields: hasMeasurementReadyFields,
  };
}

export function summarizeObservationPosture(
  observations: readonly MetaObservation[],
  minimumSampleSize = DEFAULT_MINIMUM_SAMPLE_SIZE,
): ObservationPostureSummary {
  const summary: ObservationPostureSummary = {
    total_observations: observations.length,
    effective_grade_counts: {
      exploratory: 0,
      structural: 0,
      measured: 0,
    },
    declared_grade_counts: {
      exploratory: 0,
      structural: 0,
      measured: 0,
      unlabeled: 0,
    },
    measurement_contract_status_counts: {
      none: 0,
      declared: 0,
      verified: 0,
      unlabeled: 0,
    },
    source_counts: {
      declared: 0,
      inferred: 0,
    },
    underlying_field_counts: {
      baseline_present: 0,
      measurement_window_present: 0,
      data_quality_ok: 0,
      minimum_sample_ready: 0,
      measurement_ready: 0,
    },
    policy_eligibility_counts: {
      exploratory_fact_find_only: 0,
      structural_fact_find_only: 0,
      stronger_route_eligible_measured: 0,
    },
    current_qualified_tranche: {
      measured_suffix_observations: 0,
      stronger_route_eligible_now: false,
    },
  };

  for (const observation of observations) {
    const posture = resolveObservationEvidencePosture(observation, minimumSampleSize);
    summary.effective_grade_counts[posture.grade] += 1;
    summary.source_counts[posture.source] += 1;

    if (
      observation.evidence_grade === "exploratory" ||
      observation.evidence_grade === "structural" ||
      observation.evidence_grade === "measured"
    ) {
      summary.declared_grade_counts[observation.evidence_grade] += 1;
    } else {
      summary.declared_grade_counts.unlabeled += 1;
    }

    if (
      observation.measurement_contract_status === "none" ||
      observation.measurement_contract_status === "declared" ||
      observation.measurement_contract_status === "verified"
    ) {
      summary.measurement_contract_status_counts[
        observation.measurement_contract_status
      ] += 1;
    } else {
      summary.measurement_contract_status_counts.unlabeled += 1;
    }

    if (posture.has_baseline_ref) {
      summary.underlying_field_counts.baseline_present += 1;
    }
    if (posture.has_measurement_window) {
      summary.underlying_field_counts.measurement_window_present += 1;
    }
    if (posture.has_ok_data_quality) {
      summary.underlying_field_counts.data_quality_ok += 1;
    }
    if (posture.has_minimum_sample_size) {
      summary.underlying_field_counts.minimum_sample_ready += 1;
    }
    if (posture.has_measurement_ready_fields) {
      summary.underlying_field_counts.measurement_ready += 1;
    }

    if (posture.grade === "measured" && posture.has_measurement_ready_fields) {
      summary.policy_eligibility_counts.stronger_route_eligible_measured += 1;
    } else if (posture.grade === "exploratory") {
      summary.policy_eligibility_counts.exploratory_fact_find_only += 1;
    } else {
      summary.policy_eligibility_counts.structural_fact_find_only += 1;
    }
  }

  const measuredSuffixObservations = countCurrentMeasuredSuffix(observations, minimumSampleSize);
  summary.current_qualified_tranche = {
    measured_suffix_observations: measuredSuffixObservations,
    stronger_route_eligible_now: measuredSuffixObservations > 0,
  };

  return summary;
}

export function deriveCandidateEvidencePosture(
  observations: readonly MetaObservation[],
  minimumSampleSize = DEFAULT_MINIMUM_SAMPLE_SIZE,
): CandidateEvidencePosture {
  const summary = summarizeObservationPosture(observations, minimumSampleSize);
  const strongerRouteEligible = summary.current_qualified_tranche.stronger_route_eligible_now;

  if (strongerRouteEligible) {
    return {
      grade: "measured",
      stronger_route_eligible: true,
      summary,
    };
  }

  if (
    summary.policy_eligibility_counts.structural_fact_find_only > 0 ||
    summary.policy_eligibility_counts.stronger_route_eligible_measured > 0
  ) {
    return {
      grade: "structural",
      stronger_route_eligible: false,
      summary,
    };
  }

  return {
    grade: "exploratory",
    stronger_route_eligible: false,
    summary,
  };
}
