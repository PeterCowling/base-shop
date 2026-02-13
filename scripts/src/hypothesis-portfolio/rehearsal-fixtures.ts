import {
  applyPortfolioConstraints,
  type Hypothesis,
  type PortfolioMetadata,
  rankHypotheses,
} from "@acme/lib";

import {
  injectPortfolioScores,
  type PrioritizeCandidate,
} from "./prioritize-bridge";

export interface RehearsalOutput {
  metadata: PortfolioMetadata;
  hypothesis_count: number;
  ranking: {
    admissible_ids: string[];
    blocked: Array<{ id: string; reason: string }>;
  };
  lifecycle: {
    activation_attempt: {
      hypothesis_id: string;
      blocked: boolean;
      reasons: string[];
    };
    forced_activation: {
      hypothesis_id: string;
      activation_override: boolean;
      activation_override_reason: string;
      activation_override_by: string;
      activation_override_at: string;
    };
  };
  prioritize: {
    metadata_applied: boolean;
    items: Array<{
      id: string;
      linked_hypothesis_id?: string;
      final_score: number;
      portfolio_status: string;
      blocked_reason?: string;
    }>;
  };
}

const METADATA: PortfolioMetadata = {
  max_concurrent_experiments: 1,
  monthly_experiment_budget: 8000,
  budget_timezone: "Europe/Rome",
  default_value_unit: "USD_GROSS_PROFIT",
  default_value_horizon_days: 90,
  loaded_cost_per_person_day: 300,
  ev_score_weight: 0.6,
  time_score_weight: 0.25,
  cost_score_weight: 0.15,
  default_detection_window_days: 45,
};

function makeHypothesis(
  id: string,
  overrides: Partial<Hypothesis> = {},
): Hypothesis {
  return {
    id,
    hypothesis_key: `BRIK-HYP-${id.slice(1)}`,
    business: "BRIK",
    title: `Hypothesis ${id}`,
    hypothesis_type: "offer",
    prior_confidence: 60,
    value_unit: "USD_GROSS_PROFIT",
    value_horizon_days: 90,
    upside_estimate: 12000,
    downside_estimate: 2000,
    detection_window_days: 21,
    required_spend: 600,
    required_effort_days: 2,
    dependency_hypothesis_ids: [],
    dependency_card_ids: [],
    stopping_rule: "Stop after 10 days if no uplift",
    status: "draft",
    created_date: "2026-02-13T09:00:00.000Z",
    owner: "pete",
    ...overrides,
  };
}

const HYPOTHESES: Hypothesis[] = [
  makeHypothesis("H1", {
    title: "Breakfast upsell bundle",
    upside_estimate: 22000,
    downside_estimate: 1200,
    required_spend: 350,
  }),
  makeHypothesis("H2", {
    title: "Long-stay package",
    upside_estimate: 15000,
    downside_estimate: 1800,
    required_spend: 500,
  }),
  makeHypothesis("H3", {
    title: "Late checkout paid addon",
    upside_estimate: 400,
    downside_estimate: 9500,
    required_spend: 2500,
  }),
  makeHypothesis("H4", {
    title: "Engagement rate play",
    value_unit: "CLICK_RATE",
    upside_estimate: 900,
    downside_estimate: 250,
  }),
  makeHypothesis("H5", {
    title: "Dependency-gated referral launch",
    dependency_hypothesis_ids: ["H2"],
    upside_estimate: 13000,
    downside_estimate: 1300,
    required_spend: 450,
  }),
];

const PRIORITIZE_CANDIDATES: PrioritizeCandidate[] = [
  {
    id: "C1",
    title: "Ship breakfast upsell",
    effort: 3,
    impact: 4,
    learning_value: 3,
    hypothesis_id: "H1",
  },
  {
    id: "C2",
    title: "Run late-checkout idea",
    effort: 2,
    impact: 4,
    learning_value: 3,
    tags: ["hypothesis:H3"],
  },
  {
    id: "C3",
    title: "Unlinked onboarding copy refresh",
    effort: 2,
    impact: 3,
    learning_value: 3,
  },
];

export function runHypothesisPortfolioRehearsal(): RehearsalOutput {
  const ranking = rankHypotheses(HYPOTHESES, METADATA);

  const activeH1: Hypothesis = {
    ...HYPOTHESES[0],
    status: "active",
    activated_date: "2026-02-13T10:00:00.000Z",
  };

  const activationCandidateH2: Hypothesis = {
    ...HYPOTHESES[1],
    status: "draft",
  };

  const blockedActivation = applyPortfolioConstraints({
    hypotheses: [activationCandidateH2],
    metadata: METADATA,
    activeHypotheses: [activeH1],
    allHypothesisStatuses: {
      H1: "active",
      H2: "draft",
      H3: "draft",
      H4: "draft",
      H5: "draft",
    },
    dependencyCardStatuses: {},
    candidateActivationDate: "2026-02-13T10:30:00.000Z",
  });

  const forcedActivation = {
    hypothesis_id: "H2",
    activation_override: true,
    activation_override_reason: "operator-override: urgent learning slot",
    activation_override_by: "pete",
    activation_override_at: "2026-02-13T10:45:00.000Z",
  };

  const prioritize = injectPortfolioScores(
    PRIORITIZE_CANDIDATES,
    HYPOTHESES,
    METADATA,
  );

  return {
    metadata: METADATA,
    hypothesis_count: HYPOTHESES.length,
    ranking: {
      admissible_ids: ranking.admissible.map((hypothesis) => hypothesis.id),
      blocked: ranking.blocked.map((blocked) => ({
        id: blocked.hypothesis.id,
        reason: blocked.inadmissible_reason,
      })),
    },
    lifecycle: {
      activation_attempt: {
        hypothesis_id: "H2",
        blocked: blockedActivation.blocked.length > 0,
        reasons: blockedActivation.blocked[0]?.reasons ?? [],
      },
      forced_activation: forcedActivation,
    },
    prioritize: {
      metadata_applied: prioritize.metadata_applied,
      items: prioritize.items.map((item) => ({
        id: item.id,
        linked_hypothesis_id: item.linked_hypothesis_id,
        final_score: item.final_score,
        portfolio_status: item.portfolio_status,
        blocked_reason: item.blocked_reason,
      })),
    },
  };
}

if (process.argv[1]?.includes("rehearsal-fixtures")) {
   
  console.log(JSON.stringify(runHypothesisPortfolioRehearsal(), null, 2));
}
