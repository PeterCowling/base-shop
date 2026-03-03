import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { BackboneRoutingDecision } from "./self-evolving-backbone.js";
import type { ImprovementCandidate } from "./self-evolving-contracts.js";
import type { ScoreResult } from "./self-evolving-scoring.js";

const CANDIDATE_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
  "candidates",
);

export interface RankedCandidate {
  candidate: ImprovementCandidate;
  score: ScoreResult;
  route: BackboneRoutingDecision;
  source_hard_signature: string;
  generated_at: string;
}

export interface CandidateLedger {
  schema_version: "candidate-ledger.v1";
  business: string;
  updated_at: string;
  candidates: RankedCandidate[];
}

function resolveCandidatePath(rootDir: string, businessId: string): string {
  return path.join(rootDir, CANDIDATE_ROOT, `${businessId}.json`);
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

export function mergeRankedCandidates(
  existing: RankedCandidate[],
  incoming: RankedCandidate[],
): RankedCandidate[] {
  const byCandidateId = new Map<string, RankedCandidate>();
  for (const item of existing) {
    byCandidateId.set(item.candidate.candidate_id, item);
  }
  for (const item of incoming) {
    byCandidateId.set(item.candidate.candidate_id, item);
  }
  return [...byCandidateId.values()].sort((a, b) => {
    const scoreA = a.score.priority_score_v2 ?? a.score.priority_score_v1;
    const scoreB = b.score.priority_score_v2 ?? b.score.priority_score_v1;
    return scoreB - scoreA;
  });
}
