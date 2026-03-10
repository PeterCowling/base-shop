import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { analyzeDependencyGraph } from "@acme/lib/math/graph";

import type { RankedCandidate } from "./self-evolving-candidates.js";
import type { PolicyDecisionRecord } from "./self-evolving-contracts.js";

const SELF_EVOLVING_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
);

export interface DependencyGraphCandidateSignal {
  candidate_id: string;
  bottleneck_score: number;
  shared_executor_candidate_count: number;
  shared_constraint_candidate_count: number;
}

export interface SelfEvolvingDependencyGraphSnapshot {
  schema_version: "self-evolving-dependency-graph.v1";
  business_id: string;
  snapshot_id: string;
  generated_at: string;
  node_count: number;
  edge_count: number;
  nodes: Array<{
    id: string;
    kind: "observation" | "constraint" | "candidate" | "executor";
    ref: string;
  }>;
  edges: Array<{ from: string; to: string }>;
  analysis: ReturnType<typeof analyzeDependencyGraph>;
  candidate_signals: DependencyGraphCandidateSignal[];
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareStrings);
}

function latestCandidateRouteDecisions(
  decisions: readonly PolicyDecisionRecord[],
): Map<string, PolicyDecisionRecord> {
  const latest = new Map<string, PolicyDecisionRecord>();
  for (const decision of decisions) {
    if (decision.decision_type !== "candidate_route") {
      continue;
    }
    const prior = latest.get(decision.candidate_id);
    if (!prior || Date.parse(decision.created_at) >= Date.parse(prior.created_at)) {
      latest.set(decision.candidate_id, decision);
    }
  }
  return latest;
}

export function resolveDependencyGraphPath(rootDir: string, businessId: string): string {
  return path.join(rootDir, SELF_EVOLVING_ROOT, businessId, "dependency-graph.json");
}

export function readDependencyGraphSnapshot(
  rootDir: string,
  businessId: string,
): SelfEvolvingDependencyGraphSnapshot | null {
  const filePath = resolveDependencyGraphPath(rootDir, businessId);
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as SelfEvolvingDependencyGraphSnapshot;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export function writeDependencyGraphSnapshot(
  rootDir: string,
  snapshot: SelfEvolvingDependencyGraphSnapshot,
): string {
  const filePath = resolveDependencyGraphPath(rootDir, snapshot.business_id);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf-8");
  return filePath;
}

export function buildDependencyGraphSnapshot(input: {
  business_id: string;
  ranked_candidates: readonly RankedCandidate[];
  policy_decisions: readonly PolicyDecisionRecord[];
  generated_at: string;
  snapshot_id: string;
}): SelfEvolvingDependencyGraphSnapshot | null {
  if (input.ranked_candidates.length === 0) {
    return null;
  }

  const decisionByCandidateId = latestCandidateRouteDecisions(input.policy_decisions);
  const executorCounts = new Map<string, number>();
  const constraintCounts = new Map<string, number>();

  for (const rankedCandidate of input.ranked_candidates) {
    executorCounts.set(
      rankedCandidate.candidate.executor_path,
      (executorCounts.get(rankedCandidate.candidate.executor_path) ?? 0) + 1,
    );
    const decision = decisionByCandidateId.get(rankedCandidate.candidate.candidate_id);
    for (const constraintRef of decision?.structural_snapshot.constraint_refs ?? []) {
      constraintCounts.set(constraintRef, (constraintCounts.get(constraintRef) ?? 0) + 1);
    }
  }

  const nodeRecords = new Map<string, SelfEvolvingDependencyGraphSnapshot["nodes"][number]>();
  const edges = new Map<string, { from: string; to: string }>();

  for (const rankedCandidate of input.ranked_candidates) {
    const candidateId = rankedCandidate.candidate.candidate_id;
    const candidateNodeId = `candidate:${candidateId}`;
    nodeRecords.set(candidateNodeId, {
      id: candidateNodeId,
      kind: "candidate",
      ref: candidateId,
    });

    for (const observationId of uniqueSorted(rankedCandidate.candidate.trigger_observations)) {
      const observationNodeId = `observation:${observationId}`;
      nodeRecords.set(observationNodeId, {
        id: observationNodeId,
        kind: "observation",
        ref: observationId,
      });
      edges.set(`${observationNodeId}->${candidateNodeId}`, {
        from: observationNodeId,
        to: candidateNodeId,
      });
    }

    const decision = decisionByCandidateId.get(candidateId);
    for (const constraintRef of uniqueSorted(decision?.structural_snapshot.constraint_refs ?? [])) {
      const constraintNodeId = `constraint:${constraintRef}`;
      nodeRecords.set(constraintNodeId, {
        id: constraintNodeId,
        kind: "constraint",
        ref: constraintRef,
      });
      edges.set(`${constraintNodeId}->${candidateNodeId}`, {
        from: constraintNodeId,
        to: candidateNodeId,
      });
    }

    const executorNodeId = `executor:${rankedCandidate.candidate.executor_path}`;
    nodeRecords.set(executorNodeId, {
      id: executorNodeId,
      kind: "executor",
      ref: rankedCandidate.candidate.executor_path,
    });
    edges.set(`${candidateNodeId}->${executorNodeId}`, {
      from: candidateNodeId,
      to: executorNodeId,
    });
  }

  const nodes = [...nodeRecords.values()].sort((left, right) => compareStrings(left.id, right.id));
  const normalizedEdges = [...edges.values()].sort((left, right) => {
    const fromComparison = compareStrings(left.from, right.from);
    if (fromComparison !== 0) {
      return fromComparison;
    }
    return compareStrings(left.to, right.to);
  });

  const analysis = analyzeDependencyGraph({
    nodes: nodes.map((node) => ({ id: node.id })),
    edges: normalizedEdges,
  });

  const candidateSignals = input.ranked_candidates
    .map((rankedCandidate): DependencyGraphCandidateSignal => {
      const candidateId = rankedCandidate.candidate.candidate_id;
      const bottleneckScore =
        analysis.bottleneck_scores.find((entry) => entry.node_id === `candidate:${candidateId}`)
          ?.score ?? 0;
      const decision = decisionByCandidateId.get(candidateId);
      const sharedConstraintCandidateCount = Math.max(
        0,
        ...(decision?.structural_snapshot.constraint_refs ?? []).map(
          (constraintRef) => (constraintCounts.get(constraintRef) ?? 1) - 1,
        ),
      );

      return {
        candidate_id: candidateId,
        bottleneck_score: Number(bottleneckScore.toFixed(6)),
        shared_executor_candidate_count:
          (executorCounts.get(rankedCandidate.candidate.executor_path) ?? 1) - 1,
        shared_constraint_candidate_count: sharedConstraintCandidateCount,
      };
    })
    .sort((left, right) => {
      if (right.bottleneck_score !== left.bottleneck_score) {
        return right.bottleneck_score - left.bottleneck_score;
      }
      return compareStrings(left.candidate_id, right.candidate_id);
    });

  return {
    schema_version: "self-evolving-dependency-graph.v1",
    business_id: input.business_id,
    snapshot_id: input.snapshot_id,
    generated_at: input.generated_at,
    node_count: nodes.length,
    edge_count: normalizedEdges.length,
    nodes,
    edges: normalizedEdges,
    analysis,
    candidate_signals: candidateSignals,
  };
}
