import type {
  ExplorationPolicyMode,
  PolicyAuthorityLevel,
  SelfEvolvingPolicyState,
} from "./self-evolving-contracts.js";

export function resolvePolicyAuthorityLevel(
  policyState: Pick<SelfEvolvingPolicyState, "authority_level"> | null | undefined,
): PolicyAuthorityLevel {
  return policyState?.authority_level ?? "shadow";
}

export function queueActuationEnabled(
  authorityLevel: PolicyAuthorityLevel,
): boolean {
  return authorityLevel === "guarded_trial";
}

export function promotionActuationEnabled(
  authorityLevel: PolicyAuthorityLevel,
): boolean {
  return authorityLevel === "guarded_trial";
}

export function resolveExplorationPolicyMode(input: {
  authority_level: PolicyAuthorityLevel;
  budget_slots: number;
}): ExplorationPolicyMode {
  if (input.budget_slots <= 0) {
    return "off";
  }
  return input.authority_level;
}

export function explorationActuationEnabled(
  policyMode: ExplorationPolicyMode,
): boolean {
  return policyMode === "guarded_trial";
}
