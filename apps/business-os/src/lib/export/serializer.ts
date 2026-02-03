import type {
  Card,
  Idea,
  StageDoc,
} from "@acme/platform-core/repositories/businessOs.server";

type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable };

const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;
const DATE_TIME_PREFIX = /^\d{4}-\d{2}-\d{2}[T\s]/;

function normalizeDateString(value: string): string {
  if (DATE_TIME_PREFIX.test(value)) {
    return value.slice(0, 10);
  }
  return value;
}

function normalizeValue(value: Serializable): Serializable {
  if (value === null || value === undefined) return undefined;

  if (Array.isArray(value)) {
    const normalizedItems = value
      .map((item) => normalizeValue(item))
      .filter((item): item is Exclude<Serializable, null | undefined> =>
        item !== undefined
      );
    return normalizedItems;
  }

  if (typeof value === "object") {
    const record = value as Record<string, Serializable>;
    const normalized: Record<string, Serializable> = {};
    for (const [key, raw] of Object.entries(record)) {
      const normalizedValue = normalizeValue(raw);
      if (normalizedValue === undefined) continue;
      normalized[key] = normalizedValue;
    }
    return normalized;
  }

  if (typeof value === "string") {
    if (DATE_PREFIX.test(value)) {
      return normalizeDateString(value);
    }
    return value;
  }

  return value;
}

function compareKeys(a: string, b: string): number {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA < lowerB) return -1;
  if (lowerA > lowerB) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

function requiresQuotes(value: string): boolean {
  if (value.length === 0) return true;
  if (value.trim() !== value) return true;
  if (/\n|\r|\t/.test(value)) return true;
  if (/^[\-?:,[\]{}#&*!|>'"%@`]/.test(value)) return true;
  if (value.includes(": ")) return true;
  if (value.includes(" #")) return true;
  return false;
}

function formatString(value: string): string {
  if (!requiresQuotes(value)) return value;
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/\"/g, "\\\"")
    .replace(/\n/g, "\\n");
  return `\"${escaped}\"`;
}

function formatScalar(
  value: Exclude<
    Serializable,
    null | undefined | Serializable[] | Record<string, Serializable>
  >
): string {
  if (typeof value === "string") return formatString(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function serializeYaml(value: Serializable, indent: number): string[] {
  if (value === null || value === undefined) return [];

  const prefix = " ".repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${prefix}[]`];
    }

    const lines: string[] = [];
    for (const item of value) {
      if (item === null || item === undefined) continue;
      if (Array.isArray(item) || typeof item === "object") {
        lines.push(`${prefix}-`);
        lines.push(...serializeYaml(item, indent + 2));
      } else {
        lines.push(`${prefix}- ${formatScalar(item)}`);
      }
    }
    return lines;
  }

  if (typeof value === "object") {
    const record = value as Record<string, Serializable>;
    const keys = Object.keys(record).sort(compareKeys);
    const lines: string[] = [];

    for (const key of keys) {
      const entry = record[key];
      if (entry === undefined || entry === null) continue;

      if (Array.isArray(entry)) {
        if (entry.length === 0) {
          lines.push(`${prefix}${key}: []`);
        } else {
          lines.push(`${prefix}${key}:`);
          lines.push(...serializeYaml(entry, indent + 2));
        }
        continue;
      }

      if (typeof entry === "object") {
        const nestedLines = serializeYaml(entry, indent + 2);
        if (nestedLines.length === 0) {
          lines.push(`${prefix}${key}: {}`);
        } else {
          lines.push(`${prefix}${key}:`);
          lines.push(...nestedLines);
        }
        continue;
      }

      lines.push(`${prefix}${key}: ${formatScalar(entry)}`);
    }

    return lines;
  }

  return [`${prefix}${formatScalar(value)}`];
}

function normalizeContent(content: string): string {
  const unix = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = unix
    .split("\n")
    .map((line) => line.replace(/[\t ]+$/g, ""));
  const trimmed = lines.join("\n").replace(/\n+$/g, "");
  return `${trimmed}\n`;
}

function serializeFrontmatter(frontmatter: Record<string, Serializable>): string {
  const normalized = normalizeValue(frontmatter) as Record<string, Serializable>;
  const yamlLines = serializeYaml(normalized, 0);
  return `---\n${yamlLines.join("\n")}\n---`;
}

function buildCardFrontmatter(card: Card): Record<string, Serializable> {
  const {
    content: _content,
    "content-it": _contentIt,
    filePath: _filePath,
    fileSha: _fileSha,
    ...frontmatter
  } = card as Card & Record<string, Serializable>;

  return frontmatter as Record<string, Serializable>;
}

function buildIdeaFrontmatter(idea: Idea): Record<string, Serializable> {
  const {
    content: _content,
    "content-it": _contentIt,
    filePath: _filePath,
    fileSha: _fileSha,
    ...frontmatter
  } = idea as Idea & Record<string, Serializable>;

  return frontmatter as Record<string, Serializable>;
}

function buildStageFrontmatter(stageDoc: StageDoc): Record<string, Serializable> {
  const {
    content: _content,
    filePath: _filePath,
    fileSha: _fileSha,
    ...frontmatter
  } = stageDoc as StageDoc & Record<string, Serializable>;

  return frontmatter as Record<string, Serializable>;
}

function extractSummary(content: string): string {
  const normalized = normalizeContent(content).replace(/^\s+/, "");
  const lines = normalized.split("\n");
  const summaryLines: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.startsWith("#")) continue;
    summaryLines.push(line.trim());
    if (summaryLines.length >= 3) break;
  }

  return summaryLines.join(" ");
}

function buildAgentBody(card: Card): string {
  const summary = extractSummary(card.content);
  const lines: string[] = [
    `## Card: ${card.ID}`,
    "",
  ];

  if (card.Title) {
    lines.push(`**Title:** ${card.Title}`, "");
  }

  lines.push(`**Current Lane:** ${card.Lane}`, "");

  if (card.Business) {
    lines.push(`**Business:** ${card.Business}`, "");
  }

  lines.push(`**Priority:** ${card.Priority}`, "");

  if (summary) {
    // i18n-exempt -- BOS-05 agent doc label [ttl=2026-03-31]
    lines.push("**Context for LLM:**", summary, "");
  }

  // i18n-exempt -- BOS-05 agent doc label [ttl=2026-03-31]
  lines.push("**Transition Criteria:**", "- See stage docs for details.");

  return normalizeContent(lines.join("\n"));
}

function buildAgentFrontmatter(card: Card): Record<string, Serializable> {
  return {
    Type: card.Type,
    ID: card.ID,
    Lane: card.Lane,
    Priority: card.Priority,
    Business: card.Business,
    Owner: card.Owner,
    Created: card.Created,
    Title: card.Title,
  };
}

export function serializeCard(card: Card): { userMd: string; agentMd: string } {
  const frontmatter = buildCardFrontmatter(card);
  const body = normalizeContent(card.content);
  const userMd = `${serializeFrontmatter(frontmatter)}\n\n${body}`;

  const agentFrontmatter = buildAgentFrontmatter(card);
  const agentBody = buildAgentBody(card);
  const agentMd = `${serializeFrontmatter(agentFrontmatter)}\n\n${agentBody}`;

  return { userMd, agentMd };
}

export function serializeIdea(idea: Idea): string {
  const frontmatter = buildIdeaFrontmatter(idea);
  const body = normalizeContent(idea.content);
  return `${serializeFrontmatter(frontmatter)}\n\n${body}`;
}

export function serializeStageDoc(stageDoc: StageDoc): string {
  const frontmatter = buildStageFrontmatter(stageDoc);
  const body = normalizeContent(stageDoc.content);
  return `${serializeFrontmatter(frontmatter)}\n\n${body}`;
}
