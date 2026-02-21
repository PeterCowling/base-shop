import {
  applyPortfolioConstraints,
  type Hypothesis,
  type PortfolioMetadata,
  rankHypotheses,
  validateHypothesis,
} from "@acme/lib";

import { parseFrontmatterMarkdown } from "./markdown";
import {
  archiveHypothesis,
  buildHypothesisTags,
  getPortfolioMetadata,
  type HypothesisStorageBackend,
  hypothesisToMarkdown,
  listHypotheses,
  upsertPortfolioMetadata,
} from "./storage";

export interface CommandContext {
  backend: HypothesisStorageBackend;
  now?: () => Date;
  actor?: string;
}

export class CliCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliCommandError";
  }
}

type FlagValue = string | boolean | undefined;
export type FlagMap = Record<string, FlagValue>;

function expectString(flags: FlagMap, key: string): string {
  const value = flags[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new CliCommandError(`missing required flag --${key}`);
  }
  return value.trim();
}

function optionalString(flags: FlagMap, key: string): string | undefined {
  const value = flags[key];
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  return value.trim();
}

function optionalNumber(flags: FlagMap, key: string): number | undefined {
  const raw = optionalString(flags, key);
  if (raw === undefined) {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new CliCommandError(`invalid numeric flag --${key}=${raw}`);
  }
  return parsed;
}

function expectNumber(flags: FlagMap, key: string): number {
  const value = optionalNumber(flags, key);
  if (value === undefined) {
    throw new CliCommandError(`missing required numeric flag --${key}`);
  }
  return value;
}

function parseCsv(values: string | undefined): string[] {
  if (!values) {
    return [];
  }
  return values
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function optionalCsv(flags: FlagMap, key: string): string[] | undefined {
  const values = optionalString(flags, key);
  if (values === undefined) {
    return undefined;
  }
  return parseCsv(values);
}

function isTrueFlag(flags: FlagMap, key: string): boolean {
  return flags[key] === true || flags[key] === "true";
}

function stripUndefinedFields<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Partial<T>;
}

function mapById(
  hypotheses: Hypothesis[],
): Record<string, Hypothesis["status"]> {
  const byId: Record<string, Hypothesis["status"]> = {};
  for (const hypothesis of hypotheses) {
    byId[hypothesis.id] = hypothesis.status;
  }
  return byId;
}

async function parseIdeaHypothesis(
  context: CommandContext,
  ideaId: string,
): Promise<{ ideaId: string; ideaSha?: string; hypothesis: Hypothesis }> {
  const idea = await context.backend.getIdea(ideaId);
  if (!idea) {
    throw new CliCommandError(`hypothesis idea not found: ${ideaId}`);
  }

  const parsed = parseFrontmatterMarkdown(idea.content);
  if (!parsed.ok) {
    throw new CliCommandError(`invalid_frontmatter:${parsed.error}`);
  }

  const hypothesisResult = validateHypothesis(parsed.frontmatter, {
    portfolioDefaults: { default_detection_window_days: 45 },
  });
  if (!hypothesisResult.ok) {
    throw new CliCommandError(`invalid_hypothesis:${hypothesisResult.error.code}`);
  }

  return {
    ideaId: idea.id,
    ideaSha: idea.entitySha,
    hypothesis: hypothesisResult.value,
  };
}

function parseHypothesisSequence(
  business: string,
  key: string,
): number | null {
  const matcher = new RegExp(`^${business}-HYP-(\\d+)$`);
  const match = key.match(matcher);
  if (!match) {
    return null;
  }
  const parsed = Number(match[1]);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

async function allocateHypothesisKey(
  context: CommandContext,
  business: string,
): Promise<string> {
  const existing = await listHypotheses(context.backend, {
    business,
    portfolioDefaults: { default_detection_window_days: 45 },
  });
  const maxSequence = existing.hypotheses
    .map((hypothesis) => parseHypothesisSequence(business, hypothesis.hypothesis_key))
    .filter((value): value is number => value !== null)
    .reduce((max, value) => Math.max(max, value), 0);
  return `${business}-HYP-${String(maxSequence + 1).padStart(3, "0")}`;
}

export async function createCommand(
  context: CommandContext,
  flags: FlagMap,
): Promise<{ id: string; hypothesis_key: string }> {
  const business = expectString(flags, "business");
  const hypothesisKey = await allocateHypothesisKey(context, business);
  const nowIso = (context.now ?? (() => new Date()))().toISOString();

  const hypothesis: Hypothesis = {
    id: hypothesisKey,
    hypothesis_key: hypothesisKey,
    business,
    title: expectString(flags, "title"),
    hypothesis_type: expectString(flags, "type") as Hypothesis["hypothesis_type"],
    prior_confidence: expectNumber(flags, "prior-confidence"),
    value_unit: expectString(flags, "value-unit"),
    value_horizon_days: expectNumber(flags, "value-horizon-days"),
    upside_estimate: expectNumber(flags, "upside"),
    downside_estimate: expectNumber(flags, "downside"),
    detection_window_days: optionalNumber(flags, "detection-window-days"),
    required_spend: expectNumber(flags, "required-spend"),
    required_effort_days: expectNumber(flags, "required-effort-days"),
    dependency_hypothesis_ids: parseCsv(optionalString(flags, "dependency-hypothesis-ids")),
    dependency_card_ids: parseCsv(optionalString(flags, "dependency-card-ids")),
    stopping_rule: expectString(flags, "stopping-rule"),
    status: "draft",
    created_date: nowIso,
    owner: context.actor ?? "operator",
  };

  const validated = validateHypothesis(hypothesis, {
    portfolioDefaults: { default_detection_window_days: 45 },
  });
  if (!validated.ok) {
    throw new CliCommandError(`invalid_hypothesis:${validated.error.code}`);
  }

  const created = await context.backend.createIdea({
    business,
    tags: buildHypothesisTags(validated.value.hypothesis_type, validated.value.value_unit),
    content: hypothesisToMarkdown(stripUndefinedFields(validated.value) as Hypothesis),
  });

  return {
    id: created.id,
    hypothesis_key: validated.value.hypothesis_key,
  };
}

export async function updateCommand(
  context: CommandContext,
  flags: FlagMap,
): Promise<{ id: string }> {
  const id = expectString(flags, "id");
  const existing = await parseIdeaHypothesis(context, id);
  const draft: Hypothesis = {
    ...existing.hypothesis,
    title: optionalString(flags, "title") ?? existing.hypothesis.title,
    prior_confidence:
      optionalNumber(flags, "prior-confidence") ?? existing.hypothesis.prior_confidence,
    value_unit: optionalString(flags, "value-unit") ?? existing.hypothesis.value_unit,
    value_horizon_days:
      optionalNumber(flags, "value-horizon-days") ?? existing.hypothesis.value_horizon_days,
    upside_estimate: optionalNumber(flags, "upside") ?? existing.hypothesis.upside_estimate,
    downside_estimate:
      optionalNumber(flags, "downside") ?? existing.hypothesis.downside_estimate,
    detection_window_days:
      optionalNumber(flags, "detection-window-days") ?? existing.hypothesis.detection_window_days,
    required_spend:
      optionalNumber(flags, "required-spend") ?? existing.hypothesis.required_spend,
    required_effort_days:
      optionalNumber(flags, "required-effort-days") ?? existing.hypothesis.required_effort_days,
    dependency_hypothesis_ids:
      optionalCsv(flags, "dependency-hypothesis-ids") ??
      existing.hypothesis.dependency_hypothesis_ids,
    dependency_card_ids:
      optionalCsv(flags, "dependency-card-ids") ??
      existing.hypothesis.dependency_card_ids,
    stopping_rule: optionalString(flags, "stopping-rule") ?? existing.hypothesis.stopping_rule,
  };

  const validated = validateHypothesis(draft, {
    portfolioDefaults: { default_detection_window_days: 45 },
  });
  if (!validated.ok) {
    throw new CliCommandError(`invalid_hypothesis:${validated.error.code}`);
  }

  await context.backend.updateIdea({
    id: existing.ideaId,
    entitySha: existing.ideaSha,
    content: hypothesisToMarkdown(stripUndefinedFields(validated.value) as Hypothesis),
  });
  return { id: existing.ideaId };
}

export async function setStatusCommand(
  context: CommandContext,
  flags: FlagMap,
): Promise<{ id: string; status: Hypothesis["status"]; forceUsed: boolean }> {
  const id = expectString(flags, "id");
  const status = expectString(flags, "status") as Hypothesis["status"];
  const force = isTrueFlag(flags, "force");
  const forceReason = optionalString(flags, "force-reason");
  const nowIso = (context.now ?? (() => new Date()))().toISOString();

  const existing = await parseIdeaHypothesis(context, id);
  const allBusinessHypotheses = await listHypotheses(context.backend, {
    business: existing.hypothesis.business,
    portfolioDefaults: { default_detection_window_days: 45 },
  });

  const metadata = await getPortfolioMetadata(
    context.backend,
    expectString(flags, "portfolio-card-id"),
  );
  if (!metadata) {
    throw new CliCommandError("portfolio metadata not found for activation guard");
  }

  const next: Hypothesis = {
    ...existing.hypothesis,
    status,
    activated_date:
      status === "active"
        ? optionalString(flags, "activated-date") ?? existing.hypothesis.activated_date ?? nowIso
        : existing.hypothesis.activated_date,
    stopped_date:
      status === "stopped"
        ? optionalString(flags, "stopped-date") ?? existing.hypothesis.stopped_date ?? nowIso
        : existing.hypothesis.stopped_date,
    completed_date:
      status === "completed"
        ? optionalString(flags, "completed-date") ??
          existing.hypothesis.completed_date ??
          nowIso
        : existing.hypothesis.completed_date,
    outcome: (optionalString(flags, "outcome") as Hypothesis["outcome"]) ?? existing.hypothesis.outcome,
    result_summary: optionalString(flags, "result-summary") ?? existing.hypothesis.result_summary,
  };

  if (status === "active") {
    const activationCandidate: Hypothesis = {
      ...next,
      status: "draft",
    };

    const constraints = applyPortfolioConstraints({
      hypotheses: [activationCandidate],
      metadata,
      activeHypotheses: allBusinessHypotheses.hypotheses.filter(
        (hypothesis) => hypothesis.status === "active" && hypothesis.id !== next.id,
      ),
      allHypothesisStatuses: mapById(allBusinessHypotheses.hypotheses),
      dependencyCardStatuses: {},
      candidateActivationDate: activationCandidate.activated_date,
    });
    if (constraints.blocked.length > 0 && !force) {
      throw new CliCommandError(
        `activation_blocked:${constraints.blocked[0].reasons.join("; ")}`,
      );
    }
  }

  if (force) {
    if (!forceReason) {
      throw new CliCommandError("force activation requires --force-reason");
    }
    next.activation_override = true;
    next.activation_override_reason = forceReason;
    next.activation_override_at = nowIso;
    next.activation_override_by = context.actor ?? "operator";
  }

  const validated = validateHypothesis(next, {
    portfolioDefaults: { default_detection_window_days: 45 },
  });
  if (!validated.ok) {
    throw new CliCommandError(`invalid_hypothesis:${validated.error.code}`);
  }

  await context.backend.updateIdea({
    id: existing.ideaId,
    entitySha: existing.ideaSha,
    content: hypothesisToMarkdown(stripUndefinedFields(validated.value) as Hypothesis),
  });

  return {
    id: existing.ideaId,
    status,
    forceUsed: force,
  };
}

export async function listCommand(
  context: CommandContext,
  flags: FlagMap,
): Promise<{ rows: Hypothesis[]; blocked: number }> {
  const business = expectString(flags, "business");
  const status = optionalString(flags, "status") as Hypothesis["status"] | undefined;
  const hypothesisType = optionalString(flags, "type") as Hypothesis["hypothesis_type"] | undefined;

  const listed = await listHypotheses(context.backend, {
    business,
    portfolioDefaults: { default_detection_window_days: 45 },
  });
  const rows = listed.hypotheses.filter((hypothesis) => {
    if (status && hypothesis.status !== status) {
      return false;
    }
    if (hypothesisType && hypothesis.hypothesis_type !== hypothesisType) {
      return false;
    }
    return true;
  });

  return {
    rows,
    blocked: listed.blocked.length,
  };
}

export async function rankCommand(
  context: CommandContext,
  flags: FlagMap,
): Promise<{
  admissible: ReturnType<typeof rankHypotheses>["admissible"];
  blocked: Array<{ id: string; reason: string }>;
}> {
  const business = expectString(flags, "business");
  const portfolioCardId = expectString(flags, "portfolio-card-id");
  const includeBlocked = isTrueFlag(flags, "show-blocked");

  const metadata = await getPortfolioMetadata(context.backend, portfolioCardId);
  if (!metadata) {
    throw new CliCommandError("portfolio metadata not found");
  }

  const listed = await listHypotheses(context.backend, {
    business,
    portfolioDefaults: {
      default_detection_window_days: metadata.default_detection_window_days,
    },
    portfolioDomain: {
      valueUnit: metadata.default_value_unit,
      valueHorizonDays: metadata.default_value_horizon_days,
    },
  });

  const rankResult = rankHypotheses(
    listed.hypotheses.filter(
      (hypothesis) => hypothesis.status === "draft" || hypothesis.status === "active",
    ),
    metadata,
  );
  const constrained = applyPortfolioConstraints({
    hypotheses: rankResult.admissible,
    metadata,
    activeHypotheses: listed.hypotheses.filter((hypothesis) => hypothesis.status === "active"),
    allHypothesisStatuses: mapById(listed.hypotheses),
    dependencyCardStatuses: {},
    candidateActivationDate: optionalString(flags, "activation-date"),
  });

  const blocked = [
    ...listed.blocked.map((item) => ({ id: item.id, reason: item.reason })),
    ...rankResult.blocked.map((item) => ({
      id: item.hypothesis.id,
      reason: item.inadmissible_reason,
    })),
    ...constrained.blocked.map((item) => ({
      id: item.hypothesis.id,
      reason: item.reasons.join("; "),
    })),
  ];

  return {
    admissible: constrained.admissible.map((hypothesis) => {
      const ranked = rankResult.admissible.find((item) => item.id === hypothesis.id);
      if (!ranked) {
        throw new CliCommandError(`ranked hypothesis not found for id=${hypothesis.id}`);
      }
      return ranked;
    }),
    blocked: includeBlocked ? blocked : [],
  };
}

function parsePortfolioMetadataFlags(
  flags: FlagMap,
  existing: PortfolioMetadata | null,
): PortfolioMetadata {
  const metadata: PortfolioMetadata = {
    max_concurrent_experiments:
      optionalNumber(flags, "max-concurrent") ??
      existing?.max_concurrent_experiments ??
      3,
    monthly_experiment_budget:
      optionalNumber(flags, "monthly-budget") ??
      existing?.monthly_experiment_budget ??
      5000,
    budget_timezone: optionalString(flags, "budget-timezone") ?? existing?.budget_timezone ?? "Europe/Rome",
    default_value_unit:
      optionalString(flags, "default-value-unit") ?? existing?.default_value_unit ?? "USD_GROSS_PROFIT",
    default_value_horizon_days:
      optionalNumber(flags, "default-value-horizon-days") ??
      existing?.default_value_horizon_days ??
      90,
    loaded_cost_per_person_day:
      optionalNumber(flags, "loaded-cost-per-person-day") ??
      existing?.loaded_cost_per_person_day ??
      300,
    ev_score_weight:
      optionalNumber(flags, "ev-weight") ?? existing?.ev_score_weight ?? 0.6,
    time_score_weight:
      optionalNumber(flags, "time-weight") ?? existing?.time_score_weight ?? 0.25,
    cost_score_weight:
      optionalNumber(flags, "cost-weight") ?? existing?.cost_score_weight ?? 0.15,
    default_detection_window_days:
      optionalNumber(flags, "default-detection-window-days") ??
      existing?.default_detection_window_days ??
      45,
  };

  const maxLossIfFalse =
    optionalNumber(flags, "max-loss-if-false") ??
    existing?.max_loss_if_false_per_experiment;
  if (maxLossIfFalse !== undefined) {
    metadata.max_loss_if_false_per_experiment = maxLossIfFalse;
  }

  return metadata;
}

export async function portfolioSetCommand(
  context: CommandContext,
  flags: FlagMap,
): Promise<{ cardId: string }> {
  const portfolioCardId = expectString(flags, "portfolio-card-id");
  const current = await getPortfolioMetadata(context.backend, portfolioCardId);
  const next = parsePortfolioMetadataFlags(flags, current);
  await upsertPortfolioMetadata(context.backend, portfolioCardId, next);
  return { cardId: portfolioCardId };
}

export async function archiveCommand(
  context: CommandContext,
  flags: FlagMap,
): Promise<{ id: string }> {
  const id = expectString(flags, "id");
  await archiveHypothesis(context.backend, id);
  return { id };
}

