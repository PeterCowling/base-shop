/**
 * Pure text utility functions for guide markup.
 *
 * These functions strip link tokens and markup from guide content,
 * producing plain text suitable for JSON-LD, meta descriptions, etc.
 * No React or Next.js dependencies.
 *
 * Extracted from apps/brikette/src/routes/guides/utils/_linkTokens.tsx
 */

const TOKEN_PATTERN = /%([A-Z]+):([^|%]+)\|([^%]+)%/g;
const LEGACY_TOKEN_PATTERN = /\[\[link:([^|\]]+)\|([^\]]+)\]\]/gi;
const MUSTACHE_TOKEN_PATTERN = /\{\{guide:([^|}]+)\|([^}]+)\}\}/gi;

/**
 * Sanitize a label for `%LINK:key|label%` token insertion.
 * Removes pipe and percent characters, collapses whitespace, and truncates.
 */
export function sanitizeLinkLabel(label: string): string {
  return label
    .replace(/%/gu, "")
    .replace(/\|/gu, "-")
    .replace(/\n/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 100);
}

/**
 * Strip all link tokens (%LINK:key|label%, [[link:key|label]], {{guide:key|label}})
 * and return only the label text.
 */
export function stripGuideLinkTokens(value: string | null | undefined): string {
  const text = typeof value === "string" ? value : "";
  TOKEN_PATTERN.lastIndex = 0;
  LEGACY_TOKEN_PATTERN.lastIndex = 0;
  MUSTACHE_TOKEN_PATTERN.lastIndex = 0;
  return text
    .replace(TOKEN_PATTERN, "$3")
    .replace(LEGACY_TOKEN_PATTERN, "$2")
    .replace(MUSTACHE_TOKEN_PATTERN, "$2");
}

/**
 * Strip all guide markup (link tokens, list markers, emphasis markers, escapes)
 * to produce human-readable plain text.
 */
export function stripGuideMarkup(value: string | null | undefined): string {
  let text = stripGuideLinkTokens(value);

  // Strip list markers
  text = text.replace(/(^|\n)\s*[*+-]\s+/gu, "$1");

  // Preserve escaped literal asterisks
  const ESCAPED_ASTERISK = "\u0000";
  text = text.replace(/\\\*/gu, ESCAPED_ASTERISK);

  // Remove markdown-lite emphasis markers
  text = text.replace(/\*\*\*/gu, "").replace(/\*\*/gu, "").replace(/\*/gu, "");

  // Unescape the subset we support
  text = text.replace(/\\([\\`~\[\]_#+>.\-])/gu, "$1");
  text = text.replaceAll(ESCAPED_ASTERISK, "*");

  return text;
}
