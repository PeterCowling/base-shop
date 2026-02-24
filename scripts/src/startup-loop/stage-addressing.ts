/**
 * Stage Addressing Resolver
 *
 * Canonical hierarchy for startup-loop stage identification:
 *   1. --stage <ID>         Canonical stage ID from stage-operator-map.json. Always primary; exact case-insensitive match.
 *   2. --stage-alias <slug> Deterministic slug from stage-operator-map alias_index. Fail-closed on unknown.
 *   3. --stage-label <text> Exact-match against label_operator_short or label_operator_long. Fail-closed on near-match.
 *
 * Canonical source: docs/business-os/startup-loop/_generated/stage-operator-map.json
 * Canonical decision: startup-loop-marketing-sales-capability-gap-audit TASK-18
 */

import stageOperatorMap from "../../../docs/business-os/startup-loop/_generated/stage-operator-map.json";

export type ResolveMode = "id" | "alias" | "label";

export type ResolveSuccess = {
  ok: true;
  stageId: string;
  mode: ResolveMode;
};

export type ResolveFail = {
  ok: false;
  input: string;
  mode: ResolveMode;
  reason: string;
  suggestions: string[];
};

export type ResolveResult = ResolveSuccess | ResolveFail;

// ── Indexes built once at module load time ──────────────────────────────────

/** All canonical stage IDs (upper-case). */
const CANONICAL_IDS = new Set(stageOperatorMap.stages.map((s) => s.id));
const CANONICAL_ID_LIST = stageOperatorMap.stages.map((s) => s.id);
const CANONICAL_ID_HELP = `Use a canonical stage ID: ${CANONICAL_ID_LIST.join(", ")}`;

/** Flat alias → canonical ID index from generated map. */
const ALIAS_INDEX: Record<string, string> =
  stageOperatorMap.alias_index as Record<string, string>;

/**
 * Legacy stage IDs still emitted by loop-spec-era tooling.
 * These are accepted in --stage mode and mapped to map-canonical IDs.
 */
const LEGACY_ID_COMPAT = new Set(["S3", "S10"]);

/**
 * Exact label → canonical ID index.
 * Covers both label_operator_short (e.g. "Intake") and
 * label_operator_long (e.g. "ASSESSMENT — Intake").
 */
const LABEL_INDEX: Record<string, string> = {};
for (const stage of stageOperatorMap.stages) {
  LABEL_INDEX[stage.label_operator_short] = stage.id;
  LABEL_INDEX[stage.label_operator_long] = stage.id;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Resolve a stage identifier in --stage <ID> mode.
 *
 * Accepts canonical stage IDs from stage-operator-map.json. Case-insensitive.
 * Returns fail with deterministic suggestions for unknown values.
 */
export function resolveById(input: string): ResolveResult {
  const upper = input.toUpperCase().trim();
  if (CANONICAL_IDS.has(upper)) {
    return { ok: true, stageId: upper, mode: "id" };
  }

  // Compatibility bridge: allow known legacy IDs in --stage mode.
  const legacyMappedId = ALIAS_INDEX[input.toLowerCase().trim()];
  if (LEGACY_ID_COMPAT.has(upper) && legacyMappedId) {
    return { ok: true, stageId: legacyMappedId, mode: "id" };
  }

  // Check if input matches an alias — suggest the correct path
  const aliasMatch = legacyMappedId;
  const suggestions: string[] = aliasMatch
    ? [`--stage ${aliasMatch}`, `--stage-alias ${input.toLowerCase().trim()}`]
    : [
        CANONICAL_ID_HELP,
        "Or use --stage-alias <slug> for deterministic alias resolution",
      ];

  return {
    ok: false,
    input,
    mode: "id",
    reason: `Unknown stage ID "${input}". Stage IDs are case-insensitive canonical identifiers defined in docs/business-os/startup-loop/_generated/stage-operator-map.json.`,
    suggestions,
  };
}

/**
 * Resolve a stage identifier in --stage-alias <slug> mode.
 *
 * Accepts deterministic slugs from stage-operator-map alias_index.
 * Input is normalised to lowercase. Returns fail with candidate suggestions.
 */
export function resolveByAlias(input: string): ResolveResult {
  const normalised = input.toLowerCase().trim();
  const stageId = ALIAS_INDEX[normalised];
  if (stageId) {
    return { ok: true, stageId, mode: "alias" };
  }

  // Deterministic suggestion list: aliases sharing a 3-char prefix with the input
  const allAliases = Object.keys(ALIAS_INDEX).sort();
  const prefix = normalised.slice(0, 3);
  const suggestions = allAliases
    .filter((a) => a.startsWith(prefix) || normalised.startsWith(a.slice(0, 3)))
    .slice(0, 4);

  return {
    ok: false,
    input,
    mode: "alias",
    reason: `Unknown alias "${input}". Use a deterministic slug from the stage dictionary (e.g. "intake", "offer-design", "channels", "weekly-decision").`,
    suggestions,
  };
}

/**
 * Resolve a stage identifier in --stage-label <text> mode.
 *
 * Exact-match only against label_operator_short or label_operator_long (case-sensitive).
 * Near-matches are explicitly rejected — fail-closed. Use --stage-alias for flexible resolution.
 */
export function resolveByLabel(input: string): ResolveResult {
  const stageId = LABEL_INDEX[input];
  if (stageId) {
    return { ok: true, stageId, mode: "label" };
  }

  // Provide canonical label examples — no fuzzy match, no inference
  const canonicalShortLabels = stageOperatorMap.stages
    .slice(0, 5)
    .map((s) => s.label_operator_short);

  return {
    ok: false,
    input,
    mode: "label",
    reason: `No exact label match for "${input}". --stage-label requires exact canonical label (case-sensitive). Use --stage-alias for flexible resolution.`,
    suggestions: [
      ...canonicalShortLabels,
      "See stage dictionary for full label list: docs/business-os/startup-loop/_generated/stage-operator-table.md",
    ],
  };
}

/**
 * Resolve a stage identifier using the specified mode.
 * Entry point for all startup-loop stage addressing.
 */
export function resolveStageId(input: string, mode: ResolveMode): ResolveResult {
  switch (mode) {
    case "id":
      return resolveById(input);
    case "alias":
      return resolveByAlias(input);
    case "label":
      return resolveByLabel(input);
  }
}
