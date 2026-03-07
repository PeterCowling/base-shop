import type {
  CandidateState,
  ImprovementCandidate,
} from "./self-evolving-contracts.js";

const ACTIVE_STATES: ReadonlySet<CandidateState> = new Set([
  "draft",
  "validated",
  "blocked",
  "canary",
  "monitored",
]);

const TRANSITIONS: Readonly<Record<CandidateState, CandidateState[]>> = {
  draft: ["validated", "rejected", "expired"],
  validated: ["blocked", "canary", "rejected", "expired"],
  blocked: ["validated", "expired", "rejected"],
  canary: ["promoted", "reverted", "blocked"],
  promoted: ["monitored", "reverted"],
  monitored: ["kept", "reverted", "blocked"],
  kept: [],
  reverted: [],
  rejected: [],
  expired: [],
};

export interface CandidateBudgetPolicy {
  max_active_candidates: number;
  max_candidates_created_per_day: number;
  blocked_sla_days: number;
}

export interface LifecycleTransitionResult {
  allowed: boolean;
  next_state: CandidateState;
  reason: string;
}

export function isActiveState(state: CandidateState): boolean {
  return ACTIVE_STATES.has(state);
}

export function validateTransition(
  from: CandidateState,
  to: CandidateState,
): LifecycleTransitionResult {
  if (from === to) {
    return { allowed: true, next_state: to, reason: "no_state_change" };
  }
  const allowedTargets = TRANSITIONS[from] ?? [];
  if (allowedTargets.includes(to)) {
    return { allowed: true, next_state: to, reason: "valid_transition" };
  }
  return {
    allowed: false,
    next_state: from,
    reason: `invalid_transition:${from}->${to}`,
  };
}

export function canCreateCandidate(
  candidates: ImprovementCandidate[],
  policy: CandidateBudgetPolicy,
  createdTodayCount: number,
): { allowed: boolean; reason: string } {
  const activeCount = candidates.filter((candidate) =>
    isActiveState(candidate.candidate_state),
  ).length;
  if (activeCount >= policy.max_active_candidates) {
    return {
      allowed: false,
      reason: "wip_cap_exceeded",
    };
  }
  if (createdTodayCount >= policy.max_candidates_created_per_day) {
    return {
      allowed: false,
      reason: "daily_creation_budget_exceeded",
    };
  }
  return { allowed: true, reason: "creation_allowed" };
}

export function enforceCreationGate(
  candidate: ImprovementCandidate,
): { allowed: boolean; reason: string } {
  if (candidate.executor_path.trim().length === 0) {
    return { allowed: false, reason: "missing_executor_path" };
  }
  if (candidate.trigger_observations.length === 0) {
    return { allowed: false, reason: "missing_trigger_observations" };
  }
  return { allowed: true, reason: "creation_gate_passed" };
}

export function mergeBySignatureFamily(
  candidates: ImprovementCandidate[],
  signatureFamilyByCandidateId: Record<string, string>,
): ImprovementCandidate[] {
  const buckets = new Map<string, ImprovementCandidate[]>();
  for (const candidate of candidates) {
    const family = signatureFamilyByCandidateId[candidate.candidate_id] ?? candidate.candidate_id;
    const bucket = buckets.get(family) ?? [];
    bucket.push(candidate);
    buckets.set(family, bucket);
  }

  const merged: ImprovementCandidate[] = [];
  for (const bucket of buckets.values()) {
    if (bucket.length === 1) {
      merged.push(bucket[0]);
      continue;
    }
    const first = bucket[0];
    const mergedObservations = Array.from(
      new Set(bucket.flatMap((candidate) => candidate.trigger_observations)),
    );
    merged.push({
      ...first,
      trigger_observations: mergedObservations,
      problem_statement: `${first.problem_statement} (bundled:${bucket.length})`,
    });
  }
  return merged;
}

export function enforceBlockedSla(
  candidates: ImprovementCandidate[],
  now: Date,
  blockedSlaDays: number,
): ImprovementCandidate[] {
  const maxAgeMs = blockedSlaDays * 24 * 60 * 60 * 1000;
  return candidates.map((candidate) => {
    if (candidate.candidate_state !== "blocked" || !candidate.blocked_since) {
      return candidate;
    }
    const blockedAt = Date.parse(candidate.blocked_since);
    if (Number.isNaN(blockedAt)) {
      return candidate;
    }
    if (now.getTime() - blockedAt <= maxAgeMs) {
      return candidate;
    }
    return {
      ...candidate,
      candidate_state: "expired",
      blocked_reason_code: candidate.blocked_reason_code ?? "blocked_sla_expired",
    };
  });
}
