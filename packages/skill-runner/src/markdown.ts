import yaml from "js-yaml";

export interface FrontmatterParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
  rawFrontmatter: string | null;
}

export interface TaskBlock {
  id: string;
  title: string;
  raw: string;
  fields: Record<string, string>;
  headingLine: number;
  startLine: number;
  endLine: number;
}

const TASK_ID_RE = /^[A-Z][A-Z0-9-]*-\d+$/;

export function normalizeNewlines(input: string): string {
  return input.replace(/\r\n?/g, "\n");
}

export function parseFrontmatter(content: string): FrontmatterParseResult {
  const normalized = normalizeNewlines(content);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: {}, body: normalized, rawFrontmatter: null };
  }

  let frontmatter: Record<string, unknown> = {};
  try {
    const parsed = yaml.load(match[1]) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      frontmatter = parsed as Record<string, unknown>;
    }
  } catch {
    // Invalid YAML should not crash parser callers.
  }

  return {
    frontmatter,
    body: normalized.slice(match[0].length),
    rawFrontmatter: match[1],
  };
}

export function getFrontmatterString(
  frontmatter: Record<string, unknown>,
  key: string,
): string | null {
  const target = key.trim().toLowerCase().replace(/\s+/g, "-");
  for (const [rawKey, value] of Object.entries(frontmatter)) {
    if (typeof value !== "string") {
      continue;
    }
    const normalizedKey = rawKey.trim().toLowerCase().replace(/\s+/g, "-");
    if (normalizedKey === target) {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }
  return null;
}

export function getFrontmatterStringList(
  frontmatter: Record<string, unknown>,
  key: string,
): string[] {
  const target = key.trim().toLowerCase().replace(/\s+/g, "-");
  for (const [rawKey, value] of Object.entries(frontmatter)) {
    const normalizedKey = rawKey.trim().toLowerCase().replace(/\s+/g, "-");
    if (normalizedKey !== target) {
      continue;
    }
    if (Array.isArray(value)) {
      return value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
  }
  return [];
}

export function hasSection(markdown: string, heading: string): boolean {
  const escaped = escapeRegExp(heading.trim());
  const pattern = new RegExp(`^##\\s+${escaped}\\s*$`, "m");
  return pattern.test(normalizeNewlines(markdown));
}

export function extractSection(markdown: string, heading: string): string | null {
  const normalized = normalizeNewlines(markdown);
  const lines = normalized.split("\n");
  const wanted = heading.trim().toLowerCase();
  let start = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^##\s+(.+?)\s*$/);
    if (!match) {
      continue;
    }
    if (match[1].trim().toLowerCase() === wanted) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) {
    return null;
  }

  let end = lines.length;
  for (let i = start; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }

  return lines.slice(start, end).join("\n").trim();
}

export function parseTaskBlocks(markdown: string): TaskBlock[] {
  const normalized = normalizeNewlines(markdown);
  const lines = normalized.split("\n");
  const tasks: TaskBlock[] = [];
  let active: {
    id: string;
    title: string;
    startLine: number;
    headingLine: number;
    lines: string[];
  } | null = null;

  const flush = (endLine: number): void => {
    if (!active) {
      return;
    }
    const raw = active.lines.join("\n").trimEnd();
    tasks.push({
      id: active.id,
      title: active.title,
      raw,
      fields: parseTaskFields(raw),
      headingLine: active.headingLine + 1,
      startLine: active.startLine + 1,
      endLine,
    });
    active = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const headingMatch = lines[i].match(
      /^###\s+\*{0,2}([A-Z][A-Z0-9-]*-\d+)(?::\s*([^*]+?))?\*{0,2}\s*$/,
    );
    if (headingMatch && TASK_ID_RE.test(headingMatch[1])) {
      flush(i);
      active = {
        id: headingMatch[1],
        title: (headingMatch[2] ?? "").trim(),
        startLine: i,
        headingLine: i,
        lines: [lines[i]],
      };
      continue;
    }
    if (active) {
      active.lines.push(lines[i]);
    }
  }

  flush(lines.length);
  return tasks;
}

export function parseTaskFields(taskBlockRaw: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = normalizeNewlines(taskBlockRaw).split("\n");
  for (const line of lines) {
    const boldColonInside = line.match(/^- \*\*([^*]+?):\*\*\s*(.*)$/);
    if (boldColonInside) {
      const key = normalizeFieldKey(boldColonInside[1]);
      fields[key] = boldColonInside[2].trim();
      continue;
    }
    const boldMatch = line.match(/^- \*\*([^*]+)\*\*:\s*(.*)$/);
    if (boldMatch) {
      const key = normalizeFieldKey(boldMatch[1]);
      fields[key] = boldMatch[2].trim();
      continue;
    }
    const plainMatch = line.match(/^- ([^:]+):\s*(.*)$/);
    if (plainMatch) {
      const key = normalizeFieldKey(plainMatch[1]);
      fields[key] = plainMatch[2].trim();
    }
  }
  return fields;
}

export function normalizeFieldKey(value: string): string {
  return value
    .replace(/\*/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function parseTaskIdList(rawValue: string): string[] {
  const value = rawValue.trim();
  if (
    value.length === 0 ||
    value === "-" ||
    value.toLowerCase() === "none" ||
    value.toLowerCase().startsWith("none:")
  ) {
    return [];
  }

  const candidates = value.split(/[,;]/).map((part) => part.trim());
  const output: string[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const clean = candidate.replace(/\s*\([^)]*\)\s*/g, "").trim();
    if (!clean) {
      continue;
    }
    const expanded = expandTaskIdRange(clean);
    for (const taskId of expanded) {
      if (!seen.has(taskId)) {
        seen.add(taskId);
        output.push(taskId);
      }
    }
  }

  return output;
}

export function formatTaskIdList(taskIds: readonly string[]): string {
  if (taskIds.length === 0) {
    return "-";
  }
  return taskIds.join(", ");
}

export function parseConfidencePercent(rawValue: string | undefined): number | null {
  if (!rawValue) {
    return null;
  }
  const match = rawValue.match(/(\d{1,3})\s*%?/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[1], 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.max(0, Math.min(100, parsed));
}

export function isTaskComplete(statusValue: string | undefined): boolean {
  if (!statusValue) {
    return false;
  }
  const normalized = statusValue.trim().toLowerCase();
  return normalized === "complete" || normalized.startsWith("complete ");
}

export function isTaskDeferred(statusValue: string | undefined): boolean {
  if (!statusValue) {
    return false;
  }
  return statusValue.trim().toLowerCase().startsWith("deferred");
}

function expandTaskIdRange(token: string): string[] {
  const single = token.toUpperCase();
  if (TASK_ID_RE.test(single)) {
    return [single];
  }

  const rangeMatch = token
    .trim()
    .toUpperCase()
    .match(/^([A-Z][A-Z0-9-]*-)(\d+)\s*[–-]\s*([A-Z][A-Z0-9-]*-)?(\d+)$/);
  if (!rangeMatch) {
    return [];
  }

  const leftPrefix = rangeMatch[1];
  const rightPrefix = rangeMatch[3] ?? leftPrefix;
  if (leftPrefix !== rightPrefix) {
    return [];
  }

  const from = Number.parseInt(rangeMatch[2], 10);
  const to = Number.parseInt(rangeMatch[4], 10);
  if (Number.isNaN(from) || Number.isNaN(to) || from > to) {
    return [];
  }

  const span = to - from;
  if (span > 50) {
    return [];
  }

  const out: string[] = [];
  for (let n = from; n <= to; n += 1) {
    out.push(`${leftPrefix}${n}`);
  }
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
