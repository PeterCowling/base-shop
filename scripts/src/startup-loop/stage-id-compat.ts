import * as fs from "node:fs";
import * as path from "node:path";

import stageOperatorMap from "../../../docs/business-os/startup-loop/_generated/stage-operator-map.json";

const aliasIndex: Record<string, string> =
  stageOperatorMap.alias_index as Record<string, string>;

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

export const FORECAST_STAGE_ID = aliasIndex.s3 ?? "S3";
export const WEEKLY_STAGE_ID = aliasIndex.s10 ?? "S10";

export const FORECAST_STAGE_CANDIDATES = unique([
  FORECAST_STAGE_ID,
  "S3",
]);

export const WEEKLY_STAGE_CANDIDATES = unique([
  WEEKLY_STAGE_ID,
  "S10",
]);

export function firstExistingPath(
  candidates: string[],
  pathFor: (stageId: string) => string,
  exists: (candidatePath: string) => boolean,
): { stageId: string; path: string } | null {
  for (const stageId of candidates) {
    const candidatePath = pathFor(stageId);
    if (exists(candidatePath)) {
      return { stageId, path: candidatePath };
    }
  }
  return null;
}

/**
 * Resolve stage-result path with canonical-first and legacy fallback semantics.
 *
 * Lookup order:
 * 1. Canonical nested path: stages/<STAGE>/stage-result.json
 * 2. Legacy root path: stage-result-<STAGE>.json
 */
export function resolveStageResultPath(
  runDir: string,
  candidates: string[],
): { stageId: string; path: string } | null {
  const nested = firstExistingPath(
    candidates,
    (stageId) => path.join(runDir, "stages", stageId, "stage-result.json"),
    (candidatePath) => fs.existsSync(candidatePath),
  );
  if (nested) {
    return nested;
  }

  return firstExistingPath(
    candidates,
    (stageId) => path.join(runDir, `stage-result-${stageId}.json`),
    (candidatePath) => fs.existsSync(candidatePath),
  );
}
