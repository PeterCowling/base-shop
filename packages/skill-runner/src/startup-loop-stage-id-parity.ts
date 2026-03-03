import { readFileSync } from "node:fs";

import yaml from "js-yaml";

export interface StageParityInput {
  loopSpecPath: string;
  dictionaryPath: string;
  stageMapPath: string;
  allowedRemaps?: Record<string, string>;
  allowedExtraStages?: string[];
}

export interface StageParityResult {
  mismatches: string[];
  loopSpecStages: string[];
  dictionaryStages: string[];
  mapStages: string[];
}

interface StageListDocument {
  stages?: Array<{ id?: string }>;
}

interface StageMapDocument {
  stages: Array<{ id: string }>;
  alias_index?: Record<string, string>;
}

const DEFAULT_ALLOWED_REMAPS: Record<string, string> = {
  S3: "SIGNALS-01",
  S10: "SIGNALS",
};

const DEFAULT_ALLOWED_EXTRAS = new Set([
  "SIGNALS",
  "SIGNALS-01",
  "SIGNALS-02",
  "SIGNALS-03",
  "SIGNALS-04",
  "SIGNALS-05",
]);

export function validateStartupLoopStageIdParity(
  input: StageParityInput,
): StageParityResult {
  const mismatches: string[] = [];
  const allowedRemaps = input.allowedRemaps ?? DEFAULT_ALLOWED_REMAPS;
  const allowedExtras = new Set(input.allowedExtraStages ?? [...DEFAULT_ALLOWED_EXTRAS]);

  const loopSpec = parseYamlStageDoc(readFileSync(input.loopSpecPath, "utf8"));
  const dictionary = parseYamlStageDoc(readFileSync(input.dictionaryPath, "utf8"));
  const stageMap = JSON.parse(readFileSync(input.stageMapPath, "utf8")) as StageMapDocument;

  const loopStages = sortUnique(
    (loopSpec.stages ?? [])
      .map((stage) => (stage.id ?? "").trim())
      .filter(Boolean),
  );
  const dictStages = sortUnique(
    (dictionary.stages ?? [])
      .map((stage) => (stage.id ?? "").trim())
      .filter(Boolean),
  );
  const mapStages = sortUnique(
    (stageMap.stages ?? [])
      .map((stage) => (stage.id ?? "").trim())
      .filter(Boolean),
  );

  compareMissing(loopStages, dictStages, "stage-operator-dictionary.yaml", mismatches, allowedRemaps);
  compareMissing(loopStages, mapStages, "stage-operator-map.json", mismatches, allowedRemaps);
  compareExtras(loopStages, dictStages, "stage-operator-dictionary.yaml", mismatches, allowedExtras);
  compareExtras(loopStages, mapStages, "stage-operator-map.json", mismatches, allowedExtras);

  const aliasIndex = stageMap.alias_index ?? {};
  for (const [legacy, expectedCanonical] of Object.entries(allowedRemaps)) {
    const aliasKey = legacy.toLowerCase();
    if (aliasIndex[aliasKey] !== expectedCanonical) {
      mismatches.push(
        `alias_index.${aliasKey} expected "${expectedCanonical}" but found "${aliasIndex[aliasKey] ?? "missing"}"`,
      );
    }
  }

  return {
    mismatches,
    loopSpecStages: loopStages,
    dictionaryStages: dictStages,
    mapStages,
  };
}

function compareMissing(
  source: string[],
  target: string[],
  label: string,
  mismatches: string[],
  allowedRemaps: Record<string, string>,
): void {
  const targetSet = new Set(target);
  for (const stageId of source) {
    if (targetSet.has(stageId)) {
      continue;
    }
    if (allowedRemaps[stageId]) {
      continue;
    }
    mismatches.push(`Missing stage "${stageId}" in ${label}`);
  }
}

function compareExtras(
  source: string[],
  target: string[],
  label: string,
  mismatches: string[],
  allowedExtras: Set<string>,
): void {
  const sourceSet = new Set(source);
  for (const stageId of target) {
    if (sourceSet.has(stageId) || allowedExtras.has(stageId)) {
      continue;
    }
    mismatches.push(`Unexpected stage "${stageId}" present in ${label}`);
  }
}

function sortUnique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function parseYamlStageDoc(content: string): StageListDocument {
  const parsed = yaml.load(content) as unknown;
  if (!parsed || typeof parsed !== "object") {
    return {};
  }
  return parsed as StageListDocument;
}
