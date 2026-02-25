import { createHash } from "node:crypto";

const FRONTMATTER_OPEN = "---\n";
const FRONTMATTER_CLOSE = "\n---\n";

const GENERATED_BLOCK_START_PATTERNS: ReadonlyArray<RegExp> = [
  /^\s*<!--\s*generated:start\s*-->\s*$/i,
  /^\s*<!--\s*begin generated\b.*-->\s*$/i,
  /^\s*<!--\s*generated-block:start\s*-->\s*$/i,
];

const GENERATED_BLOCK_END_PATTERNS: ReadonlyArray<RegExp> = [
  /^\s*<!--\s*generated:end\s*-->\s*$/i,
  /^\s*<!--\s*end generated\b.*-->\s*$/i,
  /^\s*<!--\s*generated-block:end\s*-->\s*$/i,
];

const GENERATED_HEADING_MARKER = /(\[generated\]|\(generated\)|generated:|auto-generated)/i;

const FORBIDDEN_CLUSTER_FINGERPRINT_INPUT_KEYS: ReadonlySet<string> = new Set([
  "semantic_delta_summary",
  "llm_summary",
  "narrative_summary",
  "free_text_summary",
]);

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function stripFrontmatter(markdown: string): string {
  const normalized = normalizeNewlines(markdown);
  if (!normalized.startsWith(FRONTMATTER_OPEN)) {
    return normalized;
  }

  const closeIndex = normalized.indexOf(FRONTMATTER_CLOSE, FRONTMATTER_OPEN.length);
  if (closeIndex < 0) {
    return normalized;
  }

  return normalized.slice(closeIndex + FRONTMATTER_CLOSE.length);
}

function headingLevel(line: string): number | null {
  const match = line.match(/^\s{0,3}(#{1,6})\s+/);
  return match ? match[1].length : null;
}

function stripGeneratedSections(markdownBody: string): string {
  const lines = normalizeNewlines(markdownBody).split("\n");
  const kept: string[] = [];

  let inGeneratedBlock = false;
  let generatedHeadingLevel: number | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (inGeneratedBlock) {
      if (GENERATED_BLOCK_END_PATTERNS.some((pattern) => pattern.test(trimmed))) {
        inGeneratedBlock = false;
      }
      continue;
    }

    if (GENERATED_BLOCK_START_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      inGeneratedBlock = true;
      continue;
    }

    const currentHeadingLevel = headingLevel(line);
    if (generatedHeadingLevel !== null) {
      if (
        currentHeadingLevel !== null &&
        currentHeadingLevel <= generatedHeadingLevel
      ) {
        generatedHeadingLevel = null;
      } else {
        continue;
      }
    }

    if (
      currentHeadingLevel !== null &&
      GENERATED_HEADING_MARKER.test(line)
    ) {
      generatedHeadingLevel = currentHeadingLevel;
      continue;
    }

    kept.push(line);
  }

  return kept.join("\n");
}

function normalizeMarkdownLine(line: string): string {
  let normalized = line;

  // Strip inline HTML comments from semantic fingerprint input.
  normalized = normalized.replace(/<!--.*?-->/g, "");

  // Ignore table separator rows (formatting-only).
  if (/^\s*\|?\s*[:\-\s|]+\|?\s*$/.test(normalized)) {
    return "";
  }

  normalized = normalized
    .replace(/^\s{0,3}#{1,6}\s+/, "")
    .replace(/^\s{0,3}>\s?/, "")
    .replace(/^\s{0,3}(?:[-*+]\s+|\d+\.\s+)/, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/[ \t]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

export interface TruthMaterialityResult {
  before_truth_fingerprint: string;
  after_truth_fingerprint: string;
  normalized_semantic_diff_hash: string;
  material_delta: boolean;
}

export interface ClusterFingerprintInput {
  root_event_id: string;
  anchor_key: string;
  evidence_ref_ids: readonly string[];
  normalized_semantic_diff_hash: string;
}

/**
 * Normalize markdown content into a deterministic semantic representation.
 * Excludes frontmatter and generated/read-model sections by design.
 */
export function normalizeForTruthFingerprint(markdown: string): string {
  const bodyOnly = stripFrontmatter(markdown);
  const withoutGeneratedSections = stripGeneratedSections(bodyOnly);

  return normalizeNewlines(withoutGeneratedSections)
    .split("\n")
    .map(normalizeMarkdownLine)
    .filter((line) => line.length > 0)
    .join("\n");
}

export function computeTruthFingerprint(markdown: string): string {
  return sha256(normalizeForTruthFingerprint(markdown));
}

export function buildNormalizedSemanticDiffFragments(
  beforeNormalized: string,
  afterNormalized: string,
): string[] {
  const beforeLines = beforeNormalized ? beforeNormalized.split("\n") : [];
  const afterLines = afterNormalized ? afterNormalized.split("\n") : [];
  const maxLength = Math.max(beforeLines.length, afterLines.length);

  const fragments: string[] = [];
  for (let index = 0; index < maxLength; index++) {
    const beforeLine = beforeLines[index] ?? null;
    const afterLine = afterLines[index] ?? null;

    if (beforeLine === afterLine) {
      continue;
    }

    if (beforeLine !== null) {
      fragments.push(`-${index}:${beforeLine}`);
    }
    if (afterLine !== null) {
      fragments.push(`+${index}:${afterLine}`);
    }
  }

  return fragments;
}

export function computeNormalizedSemanticDiffHash(
  beforeMarkdown: string,
  afterMarkdown: string,
): string {
  const beforeNormalized = normalizeForTruthFingerprint(beforeMarkdown);
  const afterNormalized = normalizeForTruthFingerprint(afterMarkdown);
  const fragments = buildNormalizedSemanticDiffFragments(
    beforeNormalized,
    afterNormalized,
  );
  return sha256(fragments.join("\n"));
}

export function computeTruthMateriality(
  beforeMarkdown: string,
  afterMarkdown: string,
): TruthMaterialityResult {
  const beforeNormalized = normalizeForTruthFingerprint(beforeMarkdown);
  const afterNormalized = normalizeForTruthFingerprint(afterMarkdown);

  const before_truth_fingerprint = sha256(beforeNormalized);
  const after_truth_fingerprint = sha256(afterNormalized);
  const normalized_semantic_diff_hash = sha256(
    buildNormalizedSemanticDiffFragments(
      beforeNormalized,
      afterNormalized,
    ).join("\n"),
  );

  return {
    before_truth_fingerprint,
    after_truth_fingerprint,
    normalized_semantic_diff_hash,
    material_delta: before_truth_fingerprint !== after_truth_fingerprint,
  };
}

export function isMaterialDelta(
  beforeMarkdown: string,
  afterMarkdown: string,
): boolean {
  return computeTruthMateriality(beforeMarkdown, afterMarkdown).material_delta;
}

export function computeClusterFingerprint(
  input: ClusterFingerprintInput & Record<string, unknown>,
): string {
  for (const forbiddenKey of FORBIDDEN_CLUSTER_FINGERPRINT_INPUT_KEYS) {
    if (forbiddenKey in input) {
      throw new Error(
        `[lp-do-ideas-fingerprint] forbidden_non_deterministic_input:${forbiddenKey}`,
      );
    }
  }

  const evidenceRefIds = [...input.evidence_ref_ids]
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .sort((left, right) => left.localeCompare(right));

  const canonical = [
    input.root_event_id.trim(),
    input.anchor_key.trim(),
    evidenceRefIds.join("|"),
    input.normalized_semantic_diff_hash.trim(),
  ].join("\n");

  return sha256(canonical);
}
