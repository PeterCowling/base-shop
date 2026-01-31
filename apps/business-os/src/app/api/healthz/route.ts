/**
 * Health Check Endpoint
 * MVP-A2: Detailed health information for monitoring
 *
 * Returns git HEAD, repo lock status, and agent run timestamp
 * for uptime monitoring (UptimeRobot, etc.)
 */

import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import simpleGit from "simple-git";

import { getRepoRoot } from "@/lib/get-repo-root";

// Node runtime required for git operations
export const runtime = "nodejs";

/**
 * Get repo lock status by checking lock file existence
 */
async function getRepoLockStatus(
  repoRoot: string
): Promise<"unlocked" | "locked" | "unknown"> {
  try {
    const lockFile = path.join(repoRoot, "docs/business-os/.locks/repo.lock");
    await fs.access(lockFile);
    return "locked";
  } catch {
    // Lock file doesn't exist or not accessible
    return "unlocked";
  }
}

/**
 * Get last agent run timestamp by scanning agent-runs directory
 */
async function getLastAgentRunTimestamp(
  repoRoot: string
): Promise<string | null> {
  try {
    const runsDir = path.join(repoRoot, "docs/business-os/agent-runs");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-04 repo-internal scan [ttl=2026-03-31]
    const entries = await fs.readdir(runsDir, { withFileTypes: true });

    // Find all run directories
    const runDirs = entries.filter((entry) => entry.isDirectory());

    if (runDirs.length === 0) {
      return null;
    }

    // Get the most recent run.log.md file timestamp
    let latestTimestamp: number | null = null;

    for (const runDir of runDirs) {
      const logFile = path.join(runsDir, runDir.name, "run.log.md");
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-04 repo-internal scan [ttl=2026-03-31]
        const stats = await fs.stat(logFile);
        const mtime = stats.mtime.getTime();

        if (latestTimestamp === null || mtime > latestTimestamp) {
          latestTimestamp = mtime;
        }
      } catch {
        // Log file doesn't exist or not accessible - skip
        continue;
      }
    }

    return latestTimestamp ? new Date(latestTimestamp).toISOString() : null;
  } catch {
    // agent-runs directory doesn't exist or not accessible
    return null;
  }
}

export async function GET() {
  const repoRoot = getRepoRoot();
  const git = simpleGit(repoRoot);

  try {
    // Get current git HEAD commit SHA
    const gitHead = await git.revparse(["HEAD"]);

    // Get repo lock status
    const repoLockStatus = await getRepoLockStatus(repoRoot);

    // Get last agent run timestamp
    const lastAgentRunTimestamp = await getLastAgentRunTimestamp(repoRoot);

    return NextResponse.json({
      status: "ok",
      gitHead: gitHead.trim(),
      repoLockStatus,
      lastAgentRunTimestamp,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // If git operations fail, still return 200 but with error info
    // (uptime checkers only care about HTTP 200 vs 500)
    return NextResponse.json(
      {
        status: "degraded",
        gitHead: null,
        repoLockStatus: "error",
        lastAgentRunTimestamp: null,
        timestamp: new Date().toISOString(),
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
