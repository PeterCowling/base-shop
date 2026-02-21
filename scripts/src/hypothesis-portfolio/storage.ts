import {
  type Hypothesis,
  type PortfolioDomain,
  type PortfolioMetadata,
  validateHypothesis,
  validatePortfolioMetadata,
} from "@acme/lib";

import {
  parseFrontmatterMarkdown,
  toFrontmatterMarkdown,
} from "./markdown";

export interface IdeaRecord {
  id: string;
  business: string;
  tags: string[];
  content: string;
  entitySha?: string;
}

export interface StageDocRecord {
  cardId: string;
  stage: string;
  content: string;
  entitySha?: string;
}

export interface CreateIdeaInput {
  business: string;
  tags: string[];
  content: string;
}

export interface UpdateIdeaInput {
  id: string;
  content: string;
  entitySha?: string;
}

export interface UpsertStageDocInput {
  cardId: string;
  stage: string;
  content: string;
  entitySha?: string;
}

export interface HypothesisStorageBackend {
  createIdea(input: CreateIdeaInput): Promise<IdeaRecord>;
  updateIdea(input: UpdateIdeaInput): Promise<IdeaRecord>;
  getIdea(id: string): Promise<IdeaRecord | null>;
  listIdeas(business: string, tag: string): Promise<IdeaRecord[]>;
  getStageDoc(cardId: string, stage: string): Promise<StageDocRecord | null>;
  upsertStageDoc(input: UpsertStageDocInput): Promise<StageDocRecord>;
}

export type BlockedReason =
  | "invalid_frontmatter"
  | "unit_horizon_mismatch"
  | "non_monetary_unit_requires_conversion";

export interface BlockedHypothesis {
  id: string;
  reason: BlockedReason;
  detail: string;
}

export interface HypothesisListResult {
  hypotheses: Hypothesis[];
  blocked: BlockedHypothesis[];
}

export interface HypothesisListOptions {
  business: string;
  portfolioDomain?: PortfolioDomain;
  portfolioDefaults?: Pick<PortfolioMetadata, "default_detection_window_days">;
}

const HYPOTHESIS_TAG = "hypothesis";
const PORTFOLIO_STATE_STAGE = "portfolio-state";

function hypothesisToFrontmatter(hypothesis: Hypothesis): Record<string, unknown> {
  return {
    schema_version: 1,
    ...hypothesis,
  };
}

function portfolioMetadataToFrontmatter(
  metadata: PortfolioMetadata,
): Record<string, unknown> {
  return {
    schema_version: 1,
    ...metadata,
  };
}

function toBlockedReason(
  code: string,
): BlockedReason {
  if (code === "unit_horizon_mismatch") {
    return "unit_horizon_mismatch";
  }
  if (code === "non_monetary_unit_requires_conversion") {
    return "non_monetary_unit_requires_conversion";
  }
  return "invalid_frontmatter";
}

export function buildHypothesisTags(
  hypothesisType: Hypothesis["hypothesis_type"],
  valueUnit: string,
): string[] {
  return [HYPOTHESIS_TAG, `hyp:${hypothesisType}`, `unit:${valueUnit}`];
}

export function hypothesisToMarkdown(hypothesis: Hypothesis, body = ""): string {
  return toFrontmatterMarkdown(hypothesisToFrontmatter(hypothesis), body);
}

export function parseHypothesisMarkdown(
  content: string,
  options: {
    portfolioDomain?: PortfolioDomain;
    portfolioDefaults?: Pick<PortfolioMetadata, "default_detection_window_days">;
  } = {},
): { ok: true; hypothesis: Hypothesis } | { ok: false; reason: BlockedReason; detail: string } {
  const parsed = parseFrontmatterMarkdown(content);
  if (!parsed.ok) {
    return {
      ok: false,
      reason: "invalid_frontmatter",
      detail: parsed.error,
    };
  }

  const hypothesisResult = validateHypothesis(parsed.frontmatter, {
    evRanked: true,
    portfolioDomain: options.portfolioDomain,
    portfolioDefaults: options.portfolioDefaults,
  });

  if (!hypothesisResult.ok) {
    return {
      ok: false,
      reason: toBlockedReason(hypothesisResult.error.code),
      detail: hypothesisResult.error.message,
    };
  }

  return {
    ok: true,
    hypothesis: hypothesisResult.value,
  };
}

export async function createHypothesis(
  backend: HypothesisStorageBackend,
  hypothesis: Hypothesis,
  body = "",
): Promise<IdeaRecord> {
  const validation = validateHypothesis(hypothesis, {
    portfolioDefaults: { default_detection_window_days: 45 },
  });
  if (!validation.ok) {
    throw new Error(`invalid_hypothesis:${validation.error.code}`);
  }

  return backend.createIdea({
    business: hypothesis.business,
    tags: buildHypothesisTags(hypothesis.hypothesis_type, hypothesis.value_unit),
    content: hypothesisToMarkdown(validation.value, body),
  });
}

export async function archiveHypothesis(
  backend: HypothesisStorageBackend,
  id: string,
): Promise<IdeaRecord> {
  const idea = await backend.getIdea(id);
  if (!idea) {
    throw new Error(`hypothesis_not_found:${id}`);
  }

  const parsed = parseHypothesisMarkdown(idea.content, {
    portfolioDefaults: { default_detection_window_days: 45 },
  });
  if (!parsed.ok) {
    throw new Error(`hypothesis_parse_failed:${parsed.reason}`);
  }

  const archived: Hypothesis = {
    ...parsed.hypothesis,
    status: "archived",
  };

  return backend.updateIdea({
    id,
    entitySha: idea.entitySha,
    content: hypothesisToMarkdown(archived),
  });
}

export async function listHypotheses(
  backend: HypothesisStorageBackend,
  options: HypothesisListOptions,
): Promise<HypothesisListResult> {
  const ideas = await backend.listIdeas(options.business, HYPOTHESIS_TAG);
  const hypotheses: Hypothesis[] = [];
  const blocked: BlockedHypothesis[] = [];

  for (const idea of ideas) {
    const parsed = parseHypothesisMarkdown(idea.content, {
      portfolioDomain: options.portfolioDomain,
      portfolioDefaults: options.portfolioDefaults,
    });
    if (!parsed.ok) {
      blocked.push({
        id: idea.id,
        reason: parsed.reason,
        detail: parsed.detail,
      });
      continue;
    }
    hypotheses.push(parsed.hypothesis);
  }

  return { hypotheses, blocked };
}

export async function upsertPortfolioMetadata(
  backend: HypothesisStorageBackend,
  cardId: string,
  metadata: PortfolioMetadata,
): Promise<StageDocRecord> {
  const validation = validatePortfolioMetadata(metadata);
  if (!validation.ok) {
    throw new Error(`invalid_portfolio_metadata:${validation.error.code}`);
  }

  const content = toFrontmatterMarkdown(portfolioMetadataToFrontmatter(validation.value));
  return backend.upsertStageDoc({
    cardId,
    stage: PORTFOLIO_STATE_STAGE,
    content,
  });
}

export async function getPortfolioMetadata(
  backend: HypothesisStorageBackend,
  cardId: string,
): Promise<PortfolioMetadata | null> {
  const stageDoc = await backend.getStageDoc(cardId, PORTFOLIO_STATE_STAGE);
  if (!stageDoc) {
    return null;
  }

  const parsed = parseFrontmatterMarkdown(stageDoc.content);
  if (!parsed.ok) {
    throw new Error(`invalid_portfolio_state_frontmatter:${parsed.error}`);
  }

  const metadataResult = validatePortfolioMetadata(parsed.frontmatter);
  if (!metadataResult.ok) {
    throw new Error(`invalid_portfolio_metadata:${metadataResult.error.code}`);
  }

  return metadataResult.value;
}

