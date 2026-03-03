import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { getFrontmatterString, parseFrontmatter } from "./markdown.js";

export interface ResolveAssessmentArtifactInput {
  globPattern: string;
}

export interface ResolveAssessmentArtifactResult {
  path: string;
  updated: string;
  tiebreakUsed: boolean;
  warnings: string[];
}

interface CandidateScore {
  filePath: string;
  updatedDisplay: string;
  updatedMs: number;
  from: "frontmatter" | "filename-date" | "mtime";
}

export function resolveAssessmentArtifact(
  input: ResolveAssessmentArtifactInput,
): ResolveAssessmentArtifactResult {
  const warnings: string[] = [];
  const pattern = normalizePosix(input.globPattern);
  const baseDir = resolveSearchRoot(pattern);
  const regex = globToRegex(pattern);

  const allFiles = listFilesRecursive(baseDir).map(normalizePosix);
  const matched = allFiles.filter((filePath) => regex.test(filePath));
  if (matched.length === 0) {
    throw new Error(`No files match pattern: ${input.globPattern}`);
  }

  const scored = matched.map((filePath) => scoreCandidate(filePath, warnings));
  scored.sort((a, b) => {
    if (a.updatedMs !== b.updatedMs) {
      return b.updatedMs - a.updatedMs;
    }
    return b.filePath.localeCompare(a.filePath);
  });

  const winner = scored[0];
  const tied = scored.filter((candidate) => candidate.updatedMs === winner.updatedMs);
  if (tied.length > 1) {
    warnings.push(
      `Tie on Updated timestamp. Selected lexicographically last: ${winner.filePath}. Tied candidates: ${tied
        .map((entry) => entry.filePath)
        .join(", ")}`,
    );
  }

  return {
    path: winner.filePath,
    updated: winner.updatedDisplay,
    tiebreakUsed: tied.length > 1,
    warnings,
  };
}

function scoreCandidate(filePath: string, warnings: string[]): CandidateScore {
  const content = readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(content);
  const updatedRaw =
    getFrontmatterString(parsed.frontmatter, "Updated") ??
    getFrontmatterString(parsed.frontmatter, "Last-updated");

  const frontmatterDate = parseDate(updatedRaw ?? "");
  if (frontmatterDate !== null) {
    return {
      filePath,
      updatedMs: frontmatterDate,
      updatedDisplay: updatedRaw ?? new Date(frontmatterDate).toISOString(),
      from: "frontmatter",
    };
  }

  if (updatedRaw) {
    warnings.push(`Unparseable Updated value "${updatedRaw}" in ${filePath}; ignoring.`);
  }

  const filenameDate = extractFilenameDate(filePath);
  if (filenameDate !== null) {
    return {
      filePath,
      updatedMs: filenameDate,
      updatedDisplay: new Date(filenameDate).toISOString(),
      from: "filename-date",
    };
  }

  const mtimeMs = statSync(filePath).mtimeMs;
  return {
    filePath,
    updatedMs: mtimeMs,
    updatedDisplay: new Date(mtimeMs).toISOString(),
    from: "mtime",
  };
}

function parseDate(raw: string): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Date.parse(raw.trim());
  return Number.isNaN(parsed) ? null : parsed;
}

function extractFilenameDate(filePath: string): number | null {
  const base = path.basename(filePath);
  const match = base.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    return null;
  }
  const parsed = Date.parse(`${match[1]}T00:00:00.000Z`);
  return Number.isNaN(parsed) ? null : parsed;
}

function resolveSearchRoot(globPattern: string): string {
  const wildcardIndex = globPattern.search(/[*?[]/);
  if (wildcardIndex < 0) {
    return path.dirname(globPattern);
  }
  const prefix = globPattern.slice(0, wildcardIndex);
  const slashIndex = prefix.lastIndexOf("/");
  const root = slashIndex >= 0 ? prefix.slice(0, slashIndex) : ".";
  return root || ".";
}

function listFilesRecursive(startDir: string): string[] {
  const output: string[] = [];
  const stack = [startDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) {
      continue;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        output.push(fullPath);
      }
    }
  }
  return output;
}

function globToRegex(globPattern: string): RegExp {
  const escaped = globPattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`);
}

function normalizePosix(input: string): string {
  return input.replace(/\\/g, "/");
}
