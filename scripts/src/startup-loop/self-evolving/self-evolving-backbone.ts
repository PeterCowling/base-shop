import type { ImprovementCandidate } from "./self-evolving-contracts.js";

export interface DispatchLikePacket {
  dispatch_id: string;
  status:
    | "fact_find_ready"
    | "plan_ready"
    | "micro_build_ready"
    | "briefing_ready"
    | "logged_no_action";
  recommended_route: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build" | "lp-do-briefing";
  area_anchor: string;
  evidence_refs: string[];
}

export interface BackboneRoutingDecision {
  route:
    | "lp-do-fact-find"
    | "lp-do-plan"
    | "lp-do-build"
    | "reject";
  reason: string;
}

export function mapCandidateToBackboneRoute(
  candidate: ImprovementCandidate,
): BackboneRoutingDecision {
  if (!candidate.executor_path) {
    return { route: "reject", reason: "missing_executor_path" };
  }

  if (candidate.candidate_type === "container_update") {
    return { route: "lp-do-build", reason: "container_update_ready_for_build" };
  }
  if (candidate.candidate_type === "deterministic_extraction") {
    return { route: "lp-do-plan", reason: "requires_spec_before_build" };
  }
  if (candidate.candidate_type === "skill_refactor") {
    return { route: "lp-do-plan", reason: "refactor_plan_required" };
  }
  return { route: "lp-do-fact-find", reason: "new_skill_needs_fact_find" };
}

export function mapDispatchToBackboneRoute(
  packet: DispatchLikePacket,
): BackboneRoutingDecision {
  if (packet.status === "logged_no_action") {
    return { route: "reject", reason: "logged_no_action" };
  }
  if (packet.recommended_route === "lp-do-fact-find") {
    return { route: "lp-do-fact-find", reason: "dispatch_routed_to_fact_find" };
  }
  if (packet.recommended_route === "lp-do-build") {
    return { route: "lp-do-build", reason: "dispatch_routed_to_micro_build" };
  }
  if (packet.recommended_route === "lp-do-plan") {
    return { route: "lp-do-plan", reason: "dispatch_routed_to_plan" };
  }
  return { route: "reject", reason: "briefing_path_not_build_backbone" };
}
