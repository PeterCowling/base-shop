import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

export type BuildOriginStatus =
  | "ready"
  | "source_missing"
  | "parse_failed"
  | "schema_invalid";

export type BuildOriginFailureCode =
  | "source_missing"
  | "read_failed"
  | "parse_failed"
  | "schema_invalid";

export interface BuildOriginFailure {
  code: BuildOriginFailureCode;
  message: string;
}

export interface BuildOriginIdentityFields {
  canonical_title: string;
  build_signal_id: string;
  recurrence_key: string;
  build_origin_status: "ready";
}

const TITLE_PREFIX_PATTERNS = [
  /^ai[-\s]to[-\s]mechanistic\s*[—–:-]\s*/i,
  /^new\s+loop\s+process\s*[—–:-]\s*/i,
  /^new\s+skill\s*[—–:-]\s*/i,
  /^new\s+open[-\s]source\s+package\s*[—–:-]\s*/i,
  /^new\s+standing\s+data\s+source\s*[—–:-]\s*/i,
];

function toPosixPath(value: string): string {
  return value.replace(/\\/g, "/");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripMarkdownFormatting(value: string): string {
  return value
    .replace(/^\*\*([^*]+)\*\*:?\s*/g, "$1 ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, " ");
}

export function normalizeBuildOriginTitle(raw: string): string {
  let normalized = normalizeWhitespace(stripMarkdownFormatting(raw));
  for (const pattern of TITLE_PREFIX_PATTERNS) {
    normalized = normalized.replace(pattern, "");
  }
  return normalizeWhitespace(normalized);
}

export function deriveBuildSignalId(reviewCycleKey: string, canonicalTitle: string): string {
  return createHash("sha1")
    .update(`${reviewCycleKey}::${canonicalTitle}`)
    .digest("hex");
}

export function deriveRecurrenceKey(canonicalTitle: string): string {
  return createHash("sha1")
    .update(normalizeBuildOriginTitle(canonicalTitle).toLowerCase())
    .digest("hex");
}

export function deriveBuildOriginIdentity(
  reviewCycleKey: string,
  rawTitle: string,
): BuildOriginIdentityFields {
  const canonicalTitle = normalizeBuildOriginTitle(rawTitle);
  return {
    canonical_title: canonicalTitle,
    build_signal_id: deriveBuildSignalId(reviewCycleKey, canonicalTitle),
    recurrence_key: deriveRecurrenceKey(canonicalTitle),
    build_origin_status: "ready",
  };
}

export function detectRepoRoot(startDir: string): string {
  let current = path.resolve(startDir);
  while (true) {
    if (
      fs.existsSync(path.join(current, ".git")) ||
      fs.existsSync(path.join(current, "pnpm-workspace.yaml"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDir);
    }
    current = parent;
  }
}

export function toRepoRelativePath(repoRoot: string, absolutePath: string): string {
  const normalizedRoot = path.resolve(repoRoot);
  const normalizedTarget = path.resolve(absolutePath);
  const relative = path.relative(normalizedRoot, normalizedTarget);
  if (relative.length === 0) {
    return path.basename(normalizedTarget);
  }
  if (relative.startsWith("..")) {
    return toPosixPath(normalizedTarget);
  }
  return toPosixPath(relative);
}
