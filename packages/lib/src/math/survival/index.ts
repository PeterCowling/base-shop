import { compute as kaplanMeierEstimate } from "@fullstax/kaplan-meier-estimator";

export interface TimeToEventObservation {
  time: number;
  event: boolean;
}

export interface SurvivalCurvePoint {
  time: number;
  survival_probability: number;
  at_risk: number;
  event_count: number;
  censored_count: number;
}

export interface SurvivalCurveEstimate {
  status: "empty" | "estimated";
  total_observations: number;
  event_count: number;
  censored_count: number;
  median_survival_time: number | null;
  points: SurvivalCurvePoint[];
}

export class SurvivalObservationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SurvivalObservationValidationError";
  }
}

function normalizeObservations(
  observations: readonly TimeToEventObservation[],
): TimeToEventObservation[] {
  return observations
    .map((observation) => {
      if (!Number.isFinite(observation.time) || observation.time < 0) {
        throw new SurvivalObservationValidationError("time_must_be_non_negative_finite");
      }
      if (typeof observation.event !== "boolean") {
        throw new SurvivalObservationValidationError("event_flag_required");
      }

      return {
        time: observation.time,
        event: observation.event,
      };
    })
    .sort((left, right) => {
      if (left.time !== right.time) {
        return left.time - right.time;
      }
      return Number(right.event) - Number(left.event);
    });
}

export function estimateKaplanMeierCurve(
  observations: readonly TimeToEventObservation[],
): SurvivalCurveEstimate {
  if (observations.length === 0) {
    return {
      status: "empty",
      total_observations: 0,
      event_count: 0,
      censored_count: 0,
      median_survival_time: null,
      points: [],
    };
  }

  const normalized = normalizeObservations(observations);
  const times = normalized.map((observation) => observation.time);
  const events = normalized.map((observation) => observation.event);
  const rawCurve = kaplanMeierEstimate(times, events);

  const grouped = new Map<number, { events: number; censored: number; survival: number }>();
  for (const point of rawCurve) {
    const existing = grouped.get(point.time) ?? {
      events: 0,
      censored: 0,
      survival: point.rate,
    };
    if (point.event) {
      existing.events += 1;
    } else {
      existing.censored += 1;
    }
    existing.survival = point.rate;
    grouped.set(point.time, existing);
  }

  const orderedTimes = [...grouped.keys()].sort((left, right) => left - right);
  let atRisk = normalized.length;
  const points: SurvivalCurvePoint[] = orderedTimes.map((time) => {
    const summary = grouped.get(time);
    if (!summary) {
      throw new SurvivalObservationValidationError(`curve_point_missing:${time}`);
    }

    const point: SurvivalCurvePoint = {
      time,
      survival_probability: summary.survival,
      at_risk: atRisk,
      event_count: summary.events,
      censored_count: summary.censored,
    };
    atRisk -= summary.events + summary.censored;
    return point;
  });

  return {
    status: "estimated",
    total_observations: normalized.length,
    event_count: normalized.filter((observation) => observation.event).length,
    censored_count: normalized.filter((observation) => !observation.event).length,
    median_survival_time:
      points.find((point) => point.survival_probability <= 0.5)?.time ?? null,
    points,
  };
}
