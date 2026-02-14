import type { Hypothesis, HypothesisStatus, PortfolioMetadata } from "./types";

export interface ConstraintBlockedHypothesis {
  hypothesis: Hypothesis;
  reasons: string[];
}

export interface ApplyConstraintsInput {
  hypotheses: Hypothesis[];
  metadata: PortfolioMetadata;
  activeHypotheses: Hypothesis[];
  allHypothesisStatuses?: Record<string, HypothesisStatus>;
  dependencyCardStatuses?: Record<string, string>;
  candidateActivationDate?: string;
}

export interface ConstraintResult {
  admissible: Hypothesis[];
  blocked: ConstraintBlockedHypothesis[];
}

const COMPLETED_CARD_STATUSES = new Set([
  "completed",
  "done",
  "shipped",
  "archived",
]);

function monthKeyFromIso(timestamp: string, timeZone: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "invalid";
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  });
  return formatter.format(date);
}

function buildStatusLookup(
  hypotheses: Hypothesis[],
  fallbackStatuses?: Record<string, HypothesisStatus>,
): Record<string, HypothesisStatus> {
  const lookup: Record<string, HypothesisStatus> = { ...(fallbackStatuses ?? {}) };
  for (const hypothesis of hypotheses) {
    lookup[hypothesis.id] = hypothesis.status;
  }
  return lookup;
}

function computeMonthSpend(
  activeHypotheses: Hypothesis[],
  targetMonthKey: string,
  timeZone: string,
): number {
  let total = 0;
  for (const hypothesis of activeHypotheses) {
    if (!hypothesis.activated_date) {
      continue;
    }
    if (monthKeyFromIso(hypothesis.activated_date, timeZone) === targetMonthKey) {
      total += hypothesis.required_spend;
    }
  }
  return total;
}

export function applyPortfolioConstraints(input: ApplyConstraintsInput): ConstraintResult {
  const {
    hypotheses,
    metadata,
    activeHypotheses,
    allHypothesisStatuses,
    dependencyCardStatuses,
    candidateActivationDate,
  } = input;

  const activeCount = activeHypotheses.filter(
    (hypothesis) => hypothesis.status === "active",
  ).length;
  const nowIso = candidateActivationDate ?? new Date().toISOString();
  const targetMonthKey = monthKeyFromIso(nowIso, metadata.budget_timezone);
  const monthSpend = computeMonthSpend(
    activeHypotheses,
    targetMonthKey,
    metadata.budget_timezone,
  );
  const statusLookup = buildStatusLookup(
    [...activeHypotheses, ...hypotheses],
    allHypothesisStatuses,
  );

  const admissible: Hypothesis[] = [];
  const blocked: ConstraintBlockedHypothesis[] = [];

  for (const hypothesis of hypotheses) {
    const reasons: string[] = [];
    if (
      hypothesis.status !== "active" &&
      activeCount >= metadata.max_concurrent_experiments
    ) {
      reasons.push(
        `Portfolio at max concurrent capacity (${activeCount}/${metadata.max_concurrent_experiments} active)`,
      );
    }

    const projectedSpend = monthSpend + hypothesis.required_spend;
    if (projectedSpend > metadata.monthly_experiment_budget) {
      reasons.push(
        `Monthly budget exhausted (${projectedSpend} / ${metadata.monthly_experiment_budget})`,
      );
    }

    if (metadata.max_loss_if_false_per_experiment != null) {
      const effortCost =
        hypothesis.required_effort_days * metadata.loaded_cost_per_person_day;
      const maxLossIfFalse =
        hypothesis.downside_estimate + hypothesis.required_spend + effortCost;
      if (maxLossIfFalse > metadata.max_loss_if_false_per_experiment) {
        reasons.push(
          `Total loss exposure exceeds risk cap (${maxLossIfFalse} > ${metadata.max_loss_if_false_per_experiment})`,
        );
      }
    }

    const unresolvedHypothesisDependency = hypothesis.dependency_hypothesis_ids.some(
      (dependencyId) => statusLookup[dependencyId] !== "completed",
    );
    const unresolvedCardDependency = hypothesis.dependency_card_ids.some(
      (dependencyCardId) =>
        !COMPLETED_CARD_STATUSES.has(
          (dependencyCardStatuses?.[dependencyCardId] ?? "").toLowerCase(),
        ),
    );
    if (unresolvedHypothesisDependency || unresolvedCardDependency) {
      reasons.push("Unresolved dependencies");
    }

    if (reasons.length > 0) {
      blocked.push({ hypothesis, reasons });
    } else {
      admissible.push(hypothesis);
    }
  }

  return { admissible, blocked };
}

