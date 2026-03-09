import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { BackboneRoutingDecision } from "./self-evolving-backbone.js";
import type {
  CandidateState,
  ImprovementCandidate,
} from "./self-evolving-contracts.js";
import { validateTransition } from "./self-evolving-lifecycle.js";
import type { ScoreResult } from "./self-evolving-scoring.js";

const SELF_EVOLVING_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
);

export interface RankedCandidate {
  candidate: ImprovementCandidate;
  score: ScoreResult;
  route: BackboneRoutingDecision;
  source_hard_signature: string;
  generated_at: string;
  policy_context?: {
    decision_id: string;
    decision_context_id: string;
    policy_version: string;
    utility_version: string;
    prior_family_version: string;
    belief_state_id: string;
    structural_snapshot_id: string;
    portfolio_decision_id?: string | null;
    portfolio_selected?: boolean | null;
    portfolio_selected_at?: string | null;
    portfolio_adjusted_utility?: number | null;
  };
}

export interface CandidateLedger {
  schema_version: "candidate-ledger.v1";
  business: string;
  updated_at: string;
  candidates: RankedCandidate[];
}

const AUTO_REOPEN_PROTECTED_STATES: ReadonlySet<CandidateState> = new Set([
  "blocked",
  "canary",
  "promoted",
  "monitored",
  "kept",
  "reverted",
  "rejected",
  "expired",
]);

function resolveCandidatePath(rootDir: string, businessId: string): string {
  return path.join(rootDir, SELF_EVOLVING_ROOT, businessId, "candidates.json");
}

export function readCandidateLedger(
  rootDir: string,
  businessId: string,
): CandidateLedger {
  const filePath = resolveCandidatePath(rootDir, businessId);
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as CandidateLedger;
    if (parsed.schema_version !== "candidate-ledger.v1") {
      throw new Error(`invalid_candidate_ledger_schema:${parsed.schema_version}`);
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        schema_version: "candidate-ledger.v1",
        business: businessId,
        updated_at: new Date(0).toISOString(),
        candidates: [],
      };
    }
    throw error;
  }
}

export function writeCandidateLedger(
  rootDir: string,
  businessId: string,
  candidates: RankedCandidate[],
): string {
  const filePath = resolveCandidatePath(rootDir, businessId);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const ledger: CandidateLedger = {
    schema_version: "candidate-ledger.v1",
    business: businessId,
    updated_at: new Date().toISOString(),
    candidates,
  };
  writeFileSync(filePath, `${JSON.stringify(ledger, null, 2)}\n`, "utf-8");
  return filePath;
}

function sortCandidates(entries: RankedCandidate[]): RankedCandidate[] {
  return [...entries].sort((a, b) => {
    const scoreA =
      a.score.utility?.net_utility ?? a.score.priority_score_v2 ?? a.score.priority_score_v1;
    const scoreB =
      b.score.utility?.net_utility ?? b.score.priority_score_v2 ?? b.score.priority_score_v1;
    return scoreB - scoreA;
  });
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function laterIsoTimestamp(left: string, right: string): string {
  const leftMs = Date.parse(left);
  const rightMs = Date.parse(right);
  if (Number.isNaN(leftMs)) return right;
  if (Number.isNaN(rightMs)) return left;
  return rightMs >= leftMs ? right : left;
}

function resolveMergedState(
  existing: ImprovementCandidate,
  incoming: ImprovementCandidate,
): CandidateState {
  if (AUTO_REOPEN_PROTECTED_STATES.has(existing.candidate_state)) {
    return existing.candidate_state;
  }

  const transition = validateTransition(existing.candidate_state, incoming.candidate_state);
  return transition.allowed ? transition.next_state : existing.candidate_state;
}

function mergeCandidate(
  existing: ImprovementCandidate,
  incoming: ImprovementCandidate,
): ImprovementCandidate {
  const mergedState = resolveMergedState(existing, incoming);
  const preservesExistingLifecycle = mergedState === existing.candidate_state;

  return {
    ...incoming,
    candidate_state: mergedState,
    trigger_observations: uniqueSorted([
      ...existing.trigger_observations,
      ...incoming.trigger_observations,
    ]),
    applicability_predicates: uniqueSorted([
      ...existing.applicability_predicates,
      ...incoming.applicability_predicates,
    ]),
    owners: uniqueSorted([...existing.owners, ...incoming.owners]),
    approvers: uniqueSorted([...existing.approvers, ...incoming.approvers]),
    unblock_requirements: uniqueSorted([
      ...existing.unblock_requirements,
      ...incoming.unblock_requirements,
    ]),
    blocked_reason_code: preservesExistingLifecycle
      ? existing.blocked_reason_code
      : incoming.blocked_reason_code,
    blocked_since: preservesExistingLifecycle ? existing.blocked_since : incoming.blocked_since,
    expiry_at: laterIsoTimestamp(existing.expiry_at, incoming.expiry_at),
  };
}

function mergeRankedCandidate(
  existing: RankedCandidate,
  incoming: RankedCandidate,
): RankedCandidate {
  return {
    ...existing,
    ...incoming,
    candidate: mergeCandidate(existing.candidate, incoming.candidate),
    generated_at: laterIsoTimestamp(existing.generated_at, incoming.generated_at),
  };
}

export function mergeRankedCandidates(
  existing: RankedCandidate[],
  incoming: RankedCandidate[],
): RankedCandidate[] {
  const byCandidateId = new Map<string, RankedCandidate>();
  for (const item of existing) {
    byCandidateId.set(item.candidate.candidate_id, item);
  }
  for (const item of incoming) {
    const prior = byCandidateId.get(item.candidate.candidate_id);
    byCandidateId.set(
      item.candidate.candidate_id,
      prior ? mergeRankedCandidate(prior, item) : item,
    );
  }
  return sortCandidates([...byCandidateId.values()]);
}
