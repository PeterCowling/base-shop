export type CanonicalStageDocKey = "fact-find" | "plan" | "build" | "reflect";

const ALIAS_TO_CANONICAL: Record<string, CanonicalStageDocKey> = {
  "lp-do-fact-find": "fact-find",
  "planned": "plan",
  "lp-do-plan": "plan",
  "lp-do-build": "build",
  "lp-reflect": "reflect",
};

const CANONICAL_KEYS = new Set<CanonicalStageDocKey>([
  "fact-find",
  "plan",
  "build",
  "reflect",
]);

export interface StageDocKeyValidationResult {
  valid: boolean;
  canonical: CanonicalStageDocKey | null;
  rejectedAliases: string[];
  reason: string;
}

export function validateStageDocKey(input: string): StageDocKeyValidationResult {
  const normalized = input.trim().toLowerCase();
  if (CANONICAL_KEYS.has(normalized as CanonicalStageDocKey)) {
    return {
      valid: true,
      canonical: normalized as CanonicalStageDocKey,
      rejectedAliases: [],
      reason: "Canonical stage-doc key accepted.",
    };
  }

  const canonical = ALIAS_TO_CANONICAL[normalized];
  if (canonical) {
    return {
      valid: false,
      canonical,
      rejectedAliases: [input],
      reason: `Alias "${input}" is rejected. Use canonical key "${canonical}".`,
    };
  }

  return {
    valid: false,
    canonical: null,
    rejectedAliases: [],
    reason: `Unknown stage-doc key "${input}".`,
  };
}
