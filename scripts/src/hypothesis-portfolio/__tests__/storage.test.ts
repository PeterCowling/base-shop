import { describe, expect, it } from "@jest/globals";

import type { Hypothesis, PortfolioMetadata } from "@acme/lib";

import type {
  CreateIdeaInput,
  HypothesisStorageBackend,
  IdeaRecord,
  StageDocRecord,
  UpdateIdeaInput,
  UpsertStageDocInput,
} from "../storage";
import {
  archiveHypothesis,
  createHypothesis,
  getPortfolioMetadata,
  listHypotheses,
  upsertPortfolioMetadata,
} from "../storage";

class InMemoryHypothesisBackend implements HypothesisStorageBackend {
  private ideas = new Map<string, IdeaRecord>();
  private stageDocs = new Map<string, StageDocRecord>();
  private sequence = 0;

  async createIdea(input: CreateIdeaInput): Promise<IdeaRecord> {
    this.sequence += 1;
    const id = `HYP-IDEA-${this.sequence}`;
    const record: IdeaRecord = {
      id,
      business: input.business,
      tags: input.tags,
      content: input.content,
      entitySha: `sha-${this.sequence}`,
    };
    this.ideas.set(id, record);
    return record;
  }

  async updateIdea(input: UpdateIdeaInput): Promise<IdeaRecord> {
    const current = this.ideas.get(input.id);
    if (!current) {
      throw new Error(`idea_not_found:${input.id}`);
    }
    const updated: IdeaRecord = {
      ...current,
      content: input.content,
      entitySha: `${current.entitySha ?? "sha"}-updated`,
    };
    this.ideas.set(input.id, updated);
    return updated;
  }

  async getIdea(id: string): Promise<IdeaRecord | null> {
    return this.ideas.get(id) ?? null;
  }

  async listIdeas(business: string, tag: string): Promise<IdeaRecord[]> {
    return [...this.ideas.values()].filter(
      (idea) => idea.business === business && idea.tags.includes(tag),
    );
  }

  async getStageDoc(cardId: string, stage: string): Promise<StageDocRecord | null> {
    return this.stageDocs.get(`${cardId}:${stage}`) ?? null;
  }

  async upsertStageDoc(input: UpsertStageDocInput): Promise<StageDocRecord> {
    const key = `${input.cardId}:${input.stage}`;
    const record: StageDocRecord = {
      cardId: input.cardId,
      stage: input.stage,
      content: input.content,
      entitySha: `stage-sha-${key}`,
    };
    this.stageDocs.set(key, record);
    return record;
  }

  async seedIdea(idea: IdeaRecord): Promise<void> {
    this.ideas.set(idea.id, idea);
  }
}

const hypothesisFixture: Hypothesis = {
  id: "BRIK-IDEA-0042",
  hypothesis_key: "BRIK-HYP-042",
  business: "BRIK",
  title: "Terrace breakfast upsell improves booking margin",
  hypothesis_type: "offer",
  prior_confidence: 60,
  value_unit: "USD_GROSS_PROFIT",
  value_horizon_days: 90,
  upside_estimate: 15000,
  downside_estimate: 2000,
  detection_window_days: 14,
  required_spend: 500,
  required_effort_days: 2,
  dependency_hypothesis_ids: [],
  dependency_card_ids: [],
  stopping_rule: "Stop if attach rate remains below 2% after 7 days",
  status: "draft",
  created_date: "2026-02-13T09:00:00.000Z",
  owner: "pete",
};

const portfolioFixture: PortfolioMetadata = {
  max_concurrent_experiments: 3,
  monthly_experiment_budget: 5000,
  budget_timezone: "Europe/Rome",
  default_value_unit: "USD_GROSS_PROFIT",
  default_value_horizon_days: 90,
  loaded_cost_per_person_day: 300,
  ev_score_weight: 0.6,
  time_score_weight: 0.25,
  cost_score_weight: 0.15,
  default_detection_window_days: 45,
};

describe("hypothesis-portfolio storage adapter", () => {
  it("creates and lists hypotheses using hypothesis tag contract", async () => {
    const backend = new InMemoryHypothesisBackend();
    const created = await createHypothesis(backend, hypothesisFixture);

    expect(created.tags).toContain("hypothesis");
    expect(created.tags).toContain("hyp:offer");
    expect(created.tags).toContain("unit:USD_GROSS_PROFIT");

    const listed = await listHypotheses(backend, {
      business: "BRIK",
      portfolioDefaults: { default_detection_window_days: 45 },
      portfolioDomain: { valueUnit: "USD_GROSS_PROFIT", valueHorizonDays: 90 },
    });

    expect(listed.hypotheses).toHaveLength(1);
    expect(listed.blocked).toHaveLength(0);
    expect(listed.hypotheses[0].id).toBe("BRIK-IDEA-0042");
  });

  it("returns invalid frontmatter ideas in blocked list", async () => {
    const backend = new InMemoryHypothesisBackend();
    await backend.seedIdea({
      id: "BROKEN-1",
      business: "BRIK",
      tags: ["hypothesis"],
      content: "not-frontmatter",
    });

    const listed = await listHypotheses(backend, {
      business: "BRIK",
      portfolioDefaults: { default_detection_window_days: 45 },
      portfolioDomain: { valueUnit: "USD_GROSS_PROFIT", valueHorizonDays: 90 },
    });

    expect(listed.hypotheses).toHaveLength(0);
    expect(listed.blocked).toHaveLength(1);
    expect(listed.blocked[0].reason).toBe("invalid_frontmatter");
  });

  it("returns domain mismatch ideas as blocked", async () => {
    const backend = new InMemoryHypothesisBackend();
    await createHypothesis(backend, hypothesisFixture);

    const listed = await listHypotheses(backend, {
      business: "BRIK",
      portfolioDefaults: { default_detection_window_days: 45 },
      portfolioDomain: { valueUnit: "USD_NET_CASHFLOW", valueHorizonDays: 30 },
    });

    expect(listed.hypotheses).toHaveLength(0);
    expect(listed.blocked).toHaveLength(1);
    expect(listed.blocked[0].reason).toBe("unit_horizon_mismatch");
  });

  it("archives an existing hypothesis by updating status", async () => {
    const backend = new InMemoryHypothesisBackend();
    const created = await createHypothesis(backend, hypothesisFixture);

    await archiveHypothesis(backend, created.id);

    const listed = await listHypotheses(backend, {
      business: "BRIK",
      portfolioDefaults: { default_detection_window_days: 45 },
      portfolioDomain: { valueUnit: "USD_GROSS_PROFIT", valueHorizonDays: 90 },
    });

    expect(listed.hypotheses).toHaveLength(1);
    expect(listed.hypotheses[0].status).toBe("archived");
  });

  it("writes and reads portfolio metadata stage-doc contract", async () => {
    const backend = new InMemoryHypothesisBackend();
    await upsertPortfolioMetadata(backend, "BRIK-PORTFOLIO-0001", portfolioFixture);

    const loaded = await getPortfolioMetadata(backend, "BRIK-PORTFOLIO-0001");

    expect(loaded).not.toBeNull();
    expect(loaded?.default_value_unit).toBe("USD_GROSS_PROFIT");
    expect(loaded?.ev_score_weight).toBeCloseTo(0.6, 10);
  });
});

