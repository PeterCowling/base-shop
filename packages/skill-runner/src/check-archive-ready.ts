import { existsSync, statSync } from "node:fs";
import path from "node:path";

const REQUIRED_FILES = [
  "build-record.user.md",
  "results-review.user.md",
  "pattern-reflection.user.md",
] as const;

export interface ArchiveReadyResult {
  archiveable: boolean;
  workspace: string;
  missing: string[];
  found: string[];
  reason: string;
}

export function checkArchiveReady(workspacePath: string): ArchiveReadyResult {
  const normalized = workspacePath.replace(/\\/g, "/");
  const underPlans = normalized.includes("docs/plans/");
  const underArchive = normalized.includes("docs/plans/_archive/");

  if (!underPlans || underArchive) {
    return {
      archiveable: false,
      workspace: workspacePath,
      missing: [...REQUIRED_FILES],
      found: [],
      reason: "Not an active plan workspace path.",
    };
  }

  const found: string[] = [];
  const missing: string[] = [];

  for (const fileName of REQUIRED_FILES) {
    const filePath = path.join(workspacePath, fileName);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      found.push(fileName);
    } else {
      missing.push(fileName);
    }
  }

  return {
    archiveable: missing.length === 0,
    workspace: workspacePath,
    missing,
    found,
    reason:
      missing.length === 0
        ? "All archive prerequisites are present."
        : `Missing archive prerequisites: ${missing.join(", ")}`,
  };
}
