export interface FrontmatterParseSuccess {
  ok: true;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface FrontmatterParseFailure {
  ok: false;
  error: string;
}

export type FrontmatterParseResult =
  | FrontmatterParseSuccess
  | FrontmatterParseFailure;

function parseScalar(raw: string): unknown {
  const trimmed = raw.trim();

  if (trimmed === "null") {
    return null;
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function parseFrontmatterMarkdown(content: string): FrontmatterParseResult {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return {
      ok: false,
      error: "missing_frontmatter_start",
    };
  }

  const endIndex = normalized.indexOf("\n---\n");
  if (endIndex < 0) {
    return {
      ok: false,
      error: "missing_frontmatter_end",
    };
  }

  const headerBlock = normalized.slice(4, endIndex);
  const body = normalized.slice(endIndex + 5);
  const frontmatter: Record<string, unknown> = {};

  for (const line of headerBlock.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      return {
        ok: false,
        error: `invalid_frontmatter_line:${line}`,
      };
    }
    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1);
    if (!key) {
      return {
        ok: false,
        error: `invalid_frontmatter_key:${line}`,
      };
    }
    frontmatter[key] = parseScalar(rawValue);
  }

  return { ok: true, frontmatter, body };
}

function serializeValue(value: unknown): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value == null) {
    return "null";
  }
  return JSON.stringify(value);
}

export function toFrontmatterMarkdown(
  frontmatter: Record<string, unknown>,
  body = "",
): string {
  const lines: string[] = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: ${serializeValue(value)}`);
  }
  lines.push("---");
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    return `${lines.join("\n")}\n`;
  }
  return `${lines.join("\n")}\n\n${trimmedBody}\n`;
}

