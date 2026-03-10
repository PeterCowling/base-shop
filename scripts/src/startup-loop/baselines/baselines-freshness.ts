import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";

export type BaselineFreshnessStatus = "ok" | "warning" | "stale";
export type BaselineFreshnessSource = "frontmatter" | "git" | "unknown";

export interface BaselineFreshnessResult {
  file: string;
  status: BaselineFreshnessStatus;
  ageSeconds: number | null;
  thresholdSeconds: number;
  sourceTimestamp: string | null;
  source: BaselineFreshnessSource;
}

export interface CheckBaselinesFreshnessOptions {
  baselinesRoot: string;
  thresholdSeconds?: number;
  nowMs?: number;
  gitDateFn?: (filePath: string) => string | null;
}

const DEFAULT_THRESHOLD_SECONDS = 60 * 60 * 24 * 90; // 90 days

/**
 * Frontmatter field priority order (case-insensitive).
 * First match wins.
 */
const FRONTMATTER_DATE_FIELDS = [
  "last_updated",
  "last-updated",
  "updated",
  "last-reviewed",
  "created",
];

/**
 * Extract the first recognized date field from YAML frontmatter.
 * Returns the ISO date string or null if no recognized field found.
 */
export function parseFrontmatterDate(content: string): string | null {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  const lines = frontmatter.split(/\r?\n/);

  for (const targetField of FRONTMATTER_DATE_FIELDS) {
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) {
        continue;
      }
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      if (key === targetField) {
        const value = line.slice(colonIndex + 1).trim();
        if (value && !Number.isNaN(Date.parse(value))) {
          return value;
        }
      }
    }
  }

  return null;
}

/**
 * Get the git commit date for a file using `git log -1 --format=%aI`.
 * Returns ISO date string or null if git is unavailable or file has no history.
 */
export function getGitCommitDate(filePath: string): string | null {
  try {
    const result = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
      encoding: "utf-8",
      timeout: 10_000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return result || null;
  } catch {
    return null;
  }
}

function classifyAge(
  ageSeconds: number,
  thresholdSeconds: number
): BaselineFreshnessStatus {
  if (ageSeconds > thresholdSeconds) {
    return "stale";
  }
  if (ageSeconds > Math.floor(thresholdSeconds / 2)) {
    return "warning";
  }
  return "ok";
}

/**
 * Scan startup-baselines directory for .md files and evaluate freshness.
 * Scans per-business subdirectories (excluding _templates/).
 */
export function checkBaselinesFreshness(
  options: CheckBaselinesFreshnessOptions
): BaselineFreshnessResult[] {
  const {
    baselinesRoot,
    thresholdSeconds = DEFAULT_THRESHOLD_SECONDS,
    nowMs = Date.now(),
    gitDateFn = getGitCommitDate,
  } = options;

  const safeThreshold =
    Number.isFinite(thresholdSeconds) && thresholdSeconds > 0
      ? Math.floor(thresholdSeconds)
      : DEFAULT_THRESHOLD_SECONDS;

  if (!existsSync(baselinesRoot)) {
    return [];
  }

  const results: BaselineFreshnessResult[] = [];
  const topEntries = readdirSync(baselinesRoot, { withFileTypes: true });

  for (const entry of topEntries) {
    if (!entry.isDirectory()) {
      continue;
    }
    // Skip _templates directory
    if (entry.name === "_templates") {
      continue;
    }

    const bizDir = path.join(baselinesRoot, entry.name);
    const mdFiles = collectMdFiles(bizDir);

    for (const filePath of mdFiles) {
      const relativePath = path.relative(baselinesRoot, filePath);
      const content = readFileSync(filePath, "utf-8");

      // Try frontmatter date first
      const frontmatterDate = parseFrontmatterDate(content);
      if (frontmatterDate) {
        const sourceTimeMs = Date.parse(frontmatterDate);
        if (!Number.isNaN(sourceTimeMs)) {
          const ageSeconds = Math.max(
            0,
            Math.floor((nowMs - sourceTimeMs) / 1000)
          );
          results.push({
            file: relativePath,
            status: classifyAge(ageSeconds, safeThreshold),
            ageSeconds,
            thresholdSeconds: safeThreshold,
            sourceTimestamp: frontmatterDate,
            source: "frontmatter",
          });
          continue;
        }
      }

      // Try git commit date fallback
      const gitDate = gitDateFn(filePath);
      if (gitDate) {
        const sourceTimeMs = Date.parse(gitDate);
        if (!Number.isNaN(sourceTimeMs)) {
          const ageSeconds = Math.max(
            0,
            Math.floor((nowMs - sourceTimeMs) / 1000)
          );
          results.push({
            file: relativePath,
            status: classifyAge(ageSeconds, safeThreshold),
            ageSeconds,
            thresholdSeconds: safeThreshold,
            sourceTimestamp: gitDate,
            source: "git",
          });
          continue;
        }
      }

      // No date available — treat as stale
      results.push({
        file: relativePath,
        status: "stale",
        ageSeconds: null,
        thresholdSeconds: safeThreshold,
        sourceTimestamp: null,
        source: "unknown",
      });
    }
  }

  return results;
}

/**
 * Recursively collect .md files from a directory.
 */
function collectMdFiles(dirPath: string): string[] {
  const files: string[] = [];
  const pending = [dirPath];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolute);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(absolute);
      }
    }
  }

  return files;
}
