import path from "node:path";

import { getContractMigrationConfig, isDualReadEnabled } from "./contract-migration";
import type { StageType } from "./types";

export type StageDocAudience = "user" | "agent";

function canonicalStageDocFilename(stage: StageType, audience: StageDocAudience): string {
  return `${stage}.${audience}.md`;
}

function legacyFilenamesForCanonical(config: { filename_aliases: Record<string, string> }, canonicalFilename: string): string[] {
  // filename_aliases is legacy -> canonical. Invert it for read/exists fallbacks.
  return Object.entries(config.filename_aliases)
    .filter(([, to]) => to === canonicalFilename)
    .map(([from]) => from);
}

export function getStageDocPathCandidates(input: {
  repoRoot: string;
  cardId: string;
  stage: StageType;
  audience: StageDocAudience;
  nowUtc?: Date;
}): {
  canonicalPath: string;
  legacyPaths: string[];
} {
  const { repoRoot, cardId, stage, audience, nowUtc } = input;
  const stageDir = path.join(repoRoot, "docs/business-os/cards", cardId);
  const canonicalName = canonicalStageDocFilename(stage, audience);
  const canonicalPath = path.join(stageDir, canonicalName);

  const { config } = getContractMigrationConfig();
  if (!isDualReadEnabled(config, nowUtc)) {
    return { canonicalPath, legacyPaths: [] };
  }

  const legacyNames = legacyFilenamesForCanonical(config, canonicalName);
  return {
    canonicalPath,
    legacyPaths: legacyNames.map((name) => path.join(stageDir, name)),
  };
}

