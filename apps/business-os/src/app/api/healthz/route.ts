/**
 * Health Check Endpoint
 * MVP-A2: Detailed health information for monitoring
 *
 * Returns git HEAD, repo lock status, and agent run timestamp
 * for uptime monitoring (UptimeRobot, etc.)
 */

import { NextResponse } from "next/server";
import simpleGit from "simple-git";

import { getRepoRoot } from "@/lib/get-repo-root";

// Node runtime required for git operations
export const runtime = "nodejs";

export async function GET() {
  const repoRoot = getRepoRoot();
  const git = simpleGit(repoRoot);

  try {
    // Get current git HEAD commit SHA
    const gitHead = await git.revparse(["HEAD"]);

    // TODO: MVP-C1 will implement repo locking
    const repoLockStatus = "not_implemented";

    // TODO: MVP-E3 will track agent run timestamps
    const lastAgentRunTimestamp = null;

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
