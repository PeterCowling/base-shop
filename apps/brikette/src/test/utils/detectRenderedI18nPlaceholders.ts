/**
 * Utility for detecting raw i18n keys and placeholder phrases in rendered text.
 *
 * Used by the i18n render-audit test suite to identify missing translations
 * that appear as raw keys (e.g., "content.cheapEats.intro") or placeholder
 * phrases (e.g., "Translation in progress").
 *
 * @see docs/plans/i18n-missing-key-detection-plan.md
 */

import {
  isPlaceholderString,
  PLACEHOLDER_PHRASES,
} from "@/routes/guides/guide-seo/content-detection/placeholders";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type PlaceholderKind = "rawKey" | "placeholderPhrase";

export interface PlaceholderFinding {
  /** The detected value (the raw key or placeholder phrase) */
  value: string;
  /** Classification of the finding */
  kind: PlaceholderKind;
  /** Surrounding context snippet (truncated) */
  snippet: string;
  /** Optional hint about where in the DOM this was found */
  locationHint?: string;
}

export interface DetectOptions {
  /**
   * Prefixes that indicate an i18n key. Only dot-paths starting with one of
   * these prefixes (or matching the default heuristics) will be flagged as
   * potential raw keys.
   *
   * @default ["content.", "pages.", "components.", "common.", "footer.", "header.", "guides.", "assistance."]
   */
  keyPrefixes?: string[];

  /**
   * Exact values to ignore (will not be flagged even if they match patterns).
   */
  allowlist?: string[];

  /**
   * Prefix patterns to ignore (values starting with these won't be flagged).
   */
  allowlistPrefixes?: string[];

  /**
   * Minimum number of dot segments required to consider a string a potential key.
   * @default 2
   */
  minDotSegments?: number;
}

export interface FormatReportOptions {
  /** Maximum number of findings to show before truncating */
  maxFindings?: number;
  /** Whether to group findings by kind */
  groupByKind?: boolean;
  /** Maximum length of each snippet */
  maxSnippetLength?: number;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const DEFAULT_KEY_PREFIXES = [
  "content.",
  "pages.",
  "components.",
  "common.",
  "footer.",
  "header.",
  "guides.",
  "assistance.",
  "translation.",
  "modals.",
  "seo.",
  "meta.",
];

const DEFAULT_MIN_DOT_SEGMENTS = 2;

// Patterns to exclude from detection (false positives)
const URL_PATTERN = /^https?:\/\//i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FILE_PATH_PATTERN = /^[./\\]|\.(?:js|ts|tsx|jsx|json|css|scss|png|jpg|svg|webp|gif|md)$/i;
const NUMERIC_DOT_PATTERN = /^\d+\.\d+/; // e.g., "3.14", "1.0.0"
const IP_ADDRESS_PATTERN = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

// ----------------------------------------------------------------------------
// Core detection
// ----------------------------------------------------------------------------

/**
 * Check if a string looks like a raw i18n key.
 *
 * A raw key typically has:
 * - Multiple dot-separated segments (e.g., "content.cheapEats.intro")
 * - Starts with a known namespace prefix
 * - Uses camelCase or lowercase segments
 */
function looksLikeRawKey(value: string, options: DetectOptions): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  // Exclude obvious false positives
  if (URL_PATTERN.test(trimmed)) return false;
  if (EMAIL_PATTERN.test(trimmed)) return false;
  if (FILE_PATH_PATTERN.test(trimmed)) return false;
  if (NUMERIC_DOT_PATTERN.test(trimmed)) return false;
  if (IP_ADDRESS_PATTERN.test(trimmed)) return false;

  // Check allowlist
  if (options.allowlist?.includes(trimmed)) return false;
  if (options.allowlistPrefixes?.some((prefix) => trimmed.startsWith(prefix))) {
    return false;
  }

  // Must have enough dot segments
  const segments = trimmed.split(".");
  const minSegments = options.minDotSegments ?? DEFAULT_MIN_DOT_SEGMENTS;
  if (segments.length < minSegments) return false;

  // Each segment should look like an identifier (no spaces, mostly alphanumeric)
  const identifierPattern = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
  const allSegmentsAreIdentifiers = segments.every((seg) =>
    identifierPattern.test(seg)
  );
  if (!allSegmentsAreIdentifiers) return false;

  // Check if it matches known key prefixes
  const prefixes = options.keyPrefixes ?? DEFAULT_KEY_PREFIXES;
  const matchesKnownPrefix = prefixes.some((prefix) =>
    trimmed.startsWith(prefix)
  );

  // If it matches a known prefix, it's likely a raw key
  if (matchesKnownPrefix) return true;

  // For unknown prefixes, require more segments and stricter pattern
  // This reduces false positives from things like "lodash.get" or "node.js"
  if (segments.length >= 3) {
    // Must have at least one camelCase segment (common in i18n keys)
    const hasCamelCase = segments.some((seg) => /[a-z][A-Z]/.test(seg));
    if (hasCamelCase) return true;
  }

  return false;
}

/**
 * Check if a string is a known placeholder phrase.
 */
function isKnownPlaceholderPhrase(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  // Use the existing isPlaceholderString function's phrase detection
  // We pass an empty key since we only want phrase detection here
  const normalised = trimmed.replace(/[.!?…]+$/u, "").toLowerCase();
  return PLACEHOLDER_PHRASES.some((phrase) => normalised === phrase);
}

/**
 * Extract text content from a DOM element or use string directly.
 */
function extractTextContent(input: Element | string): string {
  if (typeof input === "string") {
    return input;
  }
  return input.textContent ?? "";
}

/**
 * Create a snippet of context around a finding.
 */
function createSnippet(
  fullText: string,
  value: string,
  maxLength: number = 80
): string {
  const index = fullText.indexOf(value);
  if (index === -1) return value.slice(0, maxLength);

  const contextBefore = 15;
  const contextAfter = 15;

  const start = Math.max(0, index - contextBefore);
  const end = Math.min(fullText.length, index + value.length + contextAfter);

  let snippet = fullText.slice(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < fullText.length) snippet = snippet + "...";

  return snippet.slice(0, maxLength);
}

/**
 * Split text into potential tokens to check for raw keys.
 * We look for sequences that could be i18n keys (dot-separated identifiers).
 */
function tokenizeForKeyDetection(text: string): string[] {
  // Match potential dot-notation keys: word.word.word patterns
  const keyPattern = /[a-zA-Z_][a-zA-Z0-9_-]*(?:\.[a-zA-Z_][a-zA-Z0-9_-]*)+/g;
  const matches = text.match(keyPattern) ?? [];
  return matches;
}

// ----------------------------------------------------------------------------
// Main detection function
// ----------------------------------------------------------------------------

/**
 * Detect raw i18n keys and placeholder phrases in rendered text content.
 *
 * @param input - DOM element or string to scan
 * @param options - Detection configuration
 * @returns Array of findings
 *
 * @example
 * ```ts
 * const findings = detectRenderedI18nPlaceholders(container.textContent ?? "");
 * if (findings.length > 0) {
 *   console.warn("Found potential missing translations:", findings);
 * }
 * ```
 */
export function detectRenderedI18nPlaceholders(
  input: Element | string,
  options: DetectOptions = {}
): PlaceholderFinding[] {
  const text = extractTextContent(input);
  const findings: PlaceholderFinding[] = [];
  const seen = new Set<string>();

  // Detect raw keys by tokenizing the text
  const tokens = tokenizeForKeyDetection(text);
  for (const token of tokens) {
    if (seen.has(token)) continue;

    if (looksLikeRawKey(token, options)) {
      seen.add(token);
      findings.push({
        value: token,
        kind: "rawKey",
        snippet: createSnippet(text, token),
      });
    }
  }

  // Detect placeholder phrases embedded anywhere in the text
  for (const phrase of PLACEHOLDER_PHRASES) {
    // Create a case-insensitive pattern that matches the phrase with optional trailing punctuation
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const phrasePattern = new RegExp(escapedPhrase + "[.!?…]*", "gi");
    const matches = text.match(phrasePattern);
    if (matches) {
      for (const match of matches) {
        if (seen.has(match.toLowerCase())) continue;
        seen.add(match.toLowerCase());
        findings.push({
          value: match,
          kind: "placeholderPhrase",
          snippet: createSnippet(text, match),
        });
      }
    }
  }

  return findings;
}

// ----------------------------------------------------------------------------
// Reporter helper
// ----------------------------------------------------------------------------

/**
 * Format findings into a readable report string.
 *
 * @param findings - Array of placeholder findings
 * @param options - Formatting options
 * @returns Formatted report string
 */
export function formatI18nPlaceholderReport(
  findings: PlaceholderFinding[],
  options: FormatReportOptions = {}
): string {
  const {
    maxFindings = 20,
    groupByKind = true,
    maxSnippetLength = 60,
  } = options;

  if (findings.length === 0) {
    return "No i18n placeholder issues detected.";
  }

  const lines: string[] = [];
  lines.push(`Found ${findings.length} potential i18n issue(s):`);
  lines.push("");

  const displayFindings = findings.slice(0, maxFindings);
  const truncated = findings.length > maxFindings;

  if (groupByKind) {
    const rawKeys = displayFindings.filter((f) => f.kind === "rawKey");
    const placeholders = displayFindings.filter(
      (f) => f.kind === "placeholderPhrase"
    );

    if (rawKeys.length > 0) {
      lines.push(`Raw keys (${rawKeys.length}):`);
      for (const finding of rawKeys) {
        const snippet = finding.snippet.slice(0, maxSnippetLength);
        lines.push(`  - ${finding.value}`);
        lines.push(`    Context: "${snippet}"`);
      }
      lines.push("");
    }

    if (placeholders.length > 0) {
      lines.push(`Placeholder phrases (${placeholders.length}):`);
      for (const finding of placeholders) {
        lines.push(`  - "${finding.value}"`);
      }
      lines.push("");
    }
  } else {
    for (const finding of displayFindings) {
      const kindLabel = finding.kind === "rawKey" ? "[KEY]" : "[PHRASE]";
      const snippet = finding.snippet.slice(0, maxSnippetLength);
      lines.push(`${kindLabel} ${finding.value}`);
      lines.push(`  Context: "${snippet}"`);
    }
  }

  if (truncated) {
    lines.push(`... and ${findings.length - maxFindings} more`);
  }

  return lines.join("\n");
}

// Re-export for convenience
export { isPlaceholderString,PLACEHOLDER_PHRASES };
