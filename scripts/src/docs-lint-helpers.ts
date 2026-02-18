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

/**
 * Check content for bare canonical stage IDs (e.g. "S6B") used in prose
 * without adjacent label text. Returns violation messages for each bare usage.
 *
 * Compliant forms (not flagged):
 *   - `S6B — Channel strategy + GTM`  (ID followed by em-dash)
 *   - `Channel strategy + GTM (S6B)`  (ID inside parentheses)
 *   - S6B: <entry>                     (ID followed by colon)
 *   - S2B→S6B                          (stage transition arrow)
 *   - Any ID inside ``` fenced blocks or `inline code`
 *   - YAML frontmatter (between first --- delimiters)
 *
 * Warning-level check: exported for direct test use; integrated into docs-lint.ts
 * for startup-loop docs (scoped to avoid noise across unrelated docs).
 */
export function checkBareStageIds(content: string): string[] {
  const violations: string[] = [];
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
      } else if (inFrontmatter) {
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

    // Match canonical stage IDs
    const re =
      /\bS(?:0|1B?|2[AB]?|3|4|5[AB]|6B?|7|8|9B?|10)\b/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(stripped)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (!isAdjacentToLabel(stripped, start, end)) {
        violations.push(
          `Line ${lineNum}: bare stage ID "${match[0]}" without adjacent label — use "(${match[0]})" after a label, or "${match[0]} — <label>" form`,
        );
      }
    }
  }

  return violations;
}

function isAdjacentToLabel(
  line: string,
  start: number,
  end: number,
): boolean {
  // (S6B) — ID is inside parentheses (label precedes the opening paren)
  if (start > 0 && line[start - 1] === "(") return true;

  // S2B→S6B — stage transition notation
  if (start > 0 && line[start - 1] === "→") return true;

  // Label — S6B  (em-dash or en-dash before the ID)
  if (start >= 1 && /[—–]\s*$/.test(line.slice(0, start))) return true;

  const after = line.slice(end);

  // S6B — label  OR  S6B – label  (em-dash or en-dash after the ID)
  if (/^\s*[—–]/.test(after)) return true;

  // S6B: entry requirements  (colon after — heading/list form)
  if (/^\s*:/.test(after)) return true;

  // S6B)  (closing paren — ID was already inside parens)
  if (/^\s*[)→]/.test(after)) return true;

  return false;
}
