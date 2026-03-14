import { normalizeNewlines } from "./markdown.js";
import type {
  AnalysisProcessArea,
  AnalysisProcessTopology,
  FactFindProcessArea,
  FactFindProcessTopology,
  PlanProcessArea,
  PlanProcessTopology,
} from "./stage-handoff-packet-types.js";

const MAX_TEXT_LENGTH = 600;
const MAX_LIST_ITEMS = 12;
const TASK_ID_RE = /\b[A-Z][A-Z0-9-]*-\d+\b/g;

export function extractSummary(section: string | null): string | null {
  if (!section) {
    return null;
  }
  const summary = extractSubsection(section, "Summary") ?? section;
  return limitText(summary);
}

export function extractSubsection(section: string, heading: string): string | null {
  return extractSectionByMatch(
    section,
    (value) => value === heading.trim().toLowerCase(),
  );
}

export function extractSubsectionByPrefix(
  section: string,
  headingPrefix: string,
): string | null {
  const wanted = headingPrefix.trim().toLowerCase();
  return extractSectionByMatch(section, (value) => value.startsWith(wanted));
}

export function extractBullets(
  section: string | null,
  limit = MAX_LIST_ITEMS,
): string[] {
  if (!section) {
    return [];
  }
  return normalizeNewlines(section)
    .split("\n")
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1] ?? null)
    .filter((line): line is string => Boolean(line))
    .map((line) => limitText(line))
    .filter((line): line is string => Boolean(line))
    .slice(0, limit);
}

export function extractLabeledNestedBullets(
  section: string,
  label: string,
): string[] {
  const lines = normalizeNewlines(section).split("\n");
  const wanted = label.trim().toLowerCase();
  let collecting = false;
  const items: string[] = [];

  for (const line of lines) {
    const topLevel = line.match(/^\s*-\s+([^:]+):\s*(.*)$/);
    if (topLevel) {
      collecting = topLevel[1].trim().toLowerCase() === wanted;
      continue;
    }
    if (!collecting) {
      continue;
    }
    const nested = line.match(/^\s{2,}-\s+(.+)$/);
    if (!nested) {
      continue;
    }
    const value = limitText(nested[1]);
    if (value) {
      items.push(value);
    }
  }

  return items.slice(0, MAX_LIST_ITEMS);
}

export function extractNamedFields(section: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const line of normalizeNewlines(section).split("\n")) {
    const match =
      line.match(/^\s*-\s+\*\*([^*]+?):\*\*\s*(.+)$/) ??
      line.match(/^\s*-\s+\*\*([^*]+)\*\*:\s*(.+)$/) ??
      line.match(/^\s*-\s+([^:]+):\s*(.+)$/);
    if (!match) {
      continue;
    }
    const value = limitText(match[2]);
    if (value) {
      fields[match[1].trim()] = value;
    }
  }
  return fields;
}

export function extractQuestionPrompts(section: string): string[] {
  return normalizeNewlines(section)
    .split("\n")
    .map((line) => line.match(/^\s*-\s+Q:\s*(.+)$/)?.[1] ?? null)
    .filter((line): line is string => Boolean(line))
    .map((line) => limitText(line))
    .filter((line): line is string => Boolean(line))
    .slice(0, MAX_LIST_ITEMS);
}

export function extractIssueRows(section: string): Array<Record<string, string>> {
  return parseMarkdownTable(section).slice(0, MAX_LIST_ITEMS);
}

export function extractExplicitNone(section: string | null): string | null {
  const normalized = limitText(section ?? "");
  if (!normalized) {
    return null;
  }
  return normalized.toLowerCase().startsWith("none:") ? normalized : null;
}

export function parseMarkdownTable(
  section: string,
): Array<Record<string, string>> {
  const lines = normalizeNewlines(section)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  if (lines.length < 2) {
    return [];
  }

  const header = splitTableRow(lines[0]);
  const divider = splitTableRow(lines[1]);
  if (
    header.length === 0 ||
    divider.length !== header.length ||
    !divider.every((cell) => /^:?-{3,}:?$/.test(cell))
  ) {
    return [];
  }

  return lines.slice(2).map((line) => {
    const cells = splitTableRow(line);
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = limitText(cells[index] ?? "") ?? "";
    });
    return row;
  });
}

export function extractFactFindProcessTopology(
  section: string | null,
): FactFindProcessTopology {
  const none = extractExplicitNone(section);
  if (none) {
    return {
      changed: false,
      note: none,
      trigger: null,
      end_condition: null,
      areas: [],
    };
  }

  const content = section ?? "";
  const fields = extractNamedFields(content);
  const rows = parseMarkdownTable(extractSubsection(content, "Process Areas") ?? "");

  return {
    changed: true,
    note: null,
    trigger: fields["Trigger"] ?? null,
    end_condition: fields["End condition"] ?? null,
    areas: rows.slice(0, MAX_LIST_ITEMS).map(buildFactFindProcessArea),
  };
}

export function extractAnalysisProcessTopology(
  section: string | null,
): AnalysisProcessTopology {
  const none = extractExplicitNone(section);
  if (none) {
    return {
      changed: false,
      note: none,
      areas: [],
    };
  }

  return {
    changed: true,
    note: null,
    areas: parseMarkdownTable(section ?? "")
      .slice(0, MAX_LIST_ITEMS)
      .map(buildAnalysisProcessArea),
  };
}

export function extractPlanProcessTopology(
  section: string | null,
): PlanProcessTopology {
  const none = extractExplicitNone(section);
  if (none) {
    return {
      changed: false,
      note: none,
      areas: [],
    };
  }

  return {
    changed: true,
    note: null,
    areas: parseMarkdownTable(section ?? "")
      .slice(0, MAX_LIST_ITEMS)
      .map(buildPlanProcessArea),
  };
}

export function limitText(value: string): string | null {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, MAX_TEXT_LENGTH);
}

export function nullableString(value: string | undefined): string | null {
  return limitText(value ?? "");
}

function extractSectionByMatch(
  section: string,
  matches: (heading: string) => boolean,
): string | null {
  const normalized = normalizeNewlines(section);
  const lines = normalized.split("\n");
  let start = -1;
  let depth = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{3,4})\s+(.+?)\s*$/);
    if (!match) {
      continue;
    }
    if (matches(match[2].trim().toLowerCase())) {
      start = i + 1;
      depth = match[1].length;
      break;
    }
  }

  if (start === -1) {
    return null;
  }

  let end = lines.length;
  for (let i = start; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{3,4})\s+/);
    if (match && match[1].length <= depth) {
      end = i;
      break;
    }
  }

  return lines.slice(start, end).join("\n").trim();
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function buildFactFindProcessArea(
  row: Record<string, string>,
): FactFindProcessArea {
  const { id, label } = parseAreaReference(row.Area);
  return {
    id,
    label,
    flow: nullableString(row["Current step-by-step flow"]),
    owners: nullableString(row["Owners / systems / handoffs"]),
    evidence: nullableString(row["Evidence refs"]),
    issues: nullableString(row["Known issues"]),
  };
}

function buildAnalysisProcessArea(
  row: Record<string, string>,
): AnalysisProcessArea {
  const { id, label } = parseAreaReference(row.Area);
  return {
    id,
    label,
    current: nullableString(row["Current state"]),
    trigger: nullableString(row.Trigger),
    future: nullableString(row["Delivered step-by-step end state"]),
    steady: nullableString(row["What remains unchanged"]),
    seams: nullableString(row["Risks / seams to carry into planning"]),
  };
}

function buildPlanProcessArea(
  row: Record<string, string>,
): PlanProcessArea {
  const { id, label } = parseAreaReference(row.Area);
  const dependencyCell = row["Tasks / dependencies"];
  return {
    id,
    label,
    trigger: nullableString(row.Trigger),
    flow: nullableString(row["Delivered step-by-step flow"]),
    task_ids: extractTaskIds(dependencyCell),
    dependency_note: extractDependencyNote(dependencyCell),
    seams: nullableString(row["Unresolved issues / rollback seam"]),
  };
}

function parseAreaReference(
  value: string | undefined,
): { id: string | null; label: string | null } {
  const normalized = nullableString(value);
  if (!normalized) {
    return { id: null, label: null };
  }
  const match = normalized.match(/^(AREA-\d+)\s*:\s*(.+)$/i);
  if (!match) {
    return { id: null, label: normalized };
  }
  return {
    id: match[1].toUpperCase(),
    label: limitText(match[2]),
  };
}

function extractTaskIds(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  const matches = value.toUpperCase().match(TASK_ID_RE) ?? [];
  return [...new Set(matches)];
}

function extractDependencyNote(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const stripped = value
    .replace(TASK_ID_RE, " ")
    .replace(/\s*(->|→|<-|←|&|\/|,|;)\s*/g, " ")
    .replace(/\b(and|then|after|before|with|blocked by|depends on|parallel)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return limitText(stripped);
}
