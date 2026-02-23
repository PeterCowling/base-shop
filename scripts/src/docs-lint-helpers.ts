import type { DocHeader } from "./docs-lint-types";

export function parseHeader(content: string): DocHeader {
  const lines = content.split(/\r?\n/).slice(0, 50);
  const get = (prefix: string) => {
    const line = lines.find((l) => l.startsWith(prefix));
    return line ? line.slice(prefix.length).trim() || null : null;
  };
  const type = get("Type:");
  const status = get("Status:");
  const domain = get("Domain:");
  const business = get("Business:");
  const owner = get("Owner:");
  const id = get("ID:");
  const lane = get("Lane:");
  const priority = get("Priority:");
  const cardId = get("Card-ID:");
  const author = get("Author:");
  const created = get("Created:");
  const lastReviewed = get("Last-reviewed:");
  const lastUpdated = get("Last-updated:");
  const hasCodePointers = lines.some(
    (l) =>
      l.startsWith("Primary code entrypoints:") ||
      l.startsWith("Canonical code:"),
  );
  return {
    type,
    status,
    domain,
    hasCodePointers,
    business,
    owner,
    id,
    lane,
    priority,
    cardId,
    author,
    created,
    lastReviewed,
    lastUpdated,
  };
}

const CANONICAL_STAGE_ID_REGEX =
  /\b(?:ASSESSMENT(?:-(?:0[1-9]|10|11))?|MEASURE-(?:01|02)|MARKET(?:-(?:01|02|03))?|SELL(?:-(?:01|02))?|S(?:3|4|5A|5B|6|9B|10)|DO)\b/g;

const RETIRED_MARKETING_SALES_ID_REGEX =
  /\b(?:S2|S2B|S3B|S6B|GATE-S6B-STRAT-01|GATE-S6B-ACT-01|GATE-S3B-01)\b/g;

/**
 * Check content for bare canonical stage IDs (e.g. "SELL-01") used in prose
 * without adjacent label text. Returns violation messages for each bare usage.
 *
 * Compliant forms (not flagged):
 *   - `SELL-01 — Channel strategy + GTM` (ID followed by em-dash)
 *   - `Channel strategy + GTM (SELL-01)` (ID inside parentheses)
 *   - SELL-01: <entry>                   (ID followed by colon)
 *   - MARKET-02→SELL-01                  (stage transition arrow)
 *   - Any ID inside ``` fenced blocks or `inline code`
 *   - YAML frontmatter (between first --- delimiters)
 *
 * Warning-level check: exported for direct test use; integrated into docs-lint.ts
 * for startup-loop docs (scoped to avoid noise across unrelated docs).
 */
export function checkBareStageIds(content: string): string[] {
  const violations: string[] = [];
  forEachLintableLine(content, (stripped, lineNum) => {
    let match: RegExpExecArray | null;
    while ((match = CANONICAL_STAGE_ID_REGEX.exec(stripped)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (!isAdjacentToLabel(stripped, start, end)) {
        violations.push(
          `Line ${lineNum}: bare stage ID "${match[0]}" without adjacent label — use "(${match[0]})" after a label, or "${match[0]} — <label>" form`,
        );
      }
    }
  });

  return violations;
}

/**
 * Detect retired marketing/sales IDs that are disallowed after MARKET/SELL cutover.
 * This is a hard-error helper intended for active startup-loop operator docs.
 */
export function checkRetiredMarketingSalesStageIds(content: string): string[] {
  const violations: string[] = [];

  forEachLintableLine(content, (_stripped, lineNum) => {
    let match: RegExpExecArray | null;
    while ((match = RETIRED_MARKETING_SALES_ID_REGEX.exec(_stripped)) !== null) {
      violations.push(
        `Line ${lineNum}: retired stage/gate identifier "${match[0]}" is not allowed in active startup-loop docs`,
      );
    }
  });

  return violations;
}

function forEachLintableLine(
  content: string,
  visitor: (strippedLine: string, lineNum: number) => void,
) {
  const lines = content.split(/\r?\n/);

  let inFence = false;
  let inFrontmatter = false;
  let frontmatterClosed = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNum = i + 1;

    // YAML frontmatter: first --- block only (must start at line 1)
    if (!frontmatterClosed && raw.trim() === "---") {
      if (!inFrontmatter && lineNum === 1) {
        inFrontmatter = true;
        continue;
      }
      if (inFrontmatter) {
        inFrontmatter = false;
        frontmatterClosed = true;
        continue;
      }
    }
    if (inFrontmatter) continue;

    // Fenced code block tracking (``` lines)
    if (/^```/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Strip inline code spans before pattern matching
    const stripped = raw.replace(/`[^`]*`/g, "");
    visitor(stripped, lineNum);
  }
}

function isAdjacentToLabel(
  line: string,
  start: number,
  end: number,
): boolean {
  // (SELL-01) — ID is inside parentheses (label precedes the opening paren)
  if (start > 0 && line[start - 1] === "(") return true;

  // MARKET-02→SELL-01 — stage transition notation
  if (start > 0 && line[start - 1] === "→") return true;

  // Label — SELL-01  (em-dash or en-dash before the ID)
  if (start >= 1 && /[—–]\s*$/.test(line.slice(0, start))) return true;

  const after = line.slice(end);

  // SELL-01 — label  OR  SELL-01 – label  (em-dash or en-dash after the ID)
  if (/^\s*[—–]/.test(after)) return true;

  // SELL-01: entry requirements  (colon after — heading/list form)
  if (/^\s*:/.test(after)) return true;

  // SELL-01)  (closing paren — ID was already inside parens)
  if (/^\s*[)→]/.test(after)) return true;

  return false;
}
