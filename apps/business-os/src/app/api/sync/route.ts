import { NextResponse } from "next/server";

import { createRepoWriter } from "@/lib/repo-writer";

// Phase 0: Node runtime required for git operations
export const runtime = "nodejs";

/**
 * POST /api/sync
 * Sync local commits to remote (push)
 *
 * Phase 0: Pete-only, local-only, no auth
 * Returns PR links for manual verification (no GitHub API polling)
 */
export async function POST() {
  try {
    // Get repo root
    const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");

    // Create writer
    const writer = createRepoWriter(repoRoot);

    // Check if worktree is ready
    const isReady = await writer.isWorktreeReady();
    if (!isReady) {
      return NextResponse.json(
        {
          error: "Worktree not initialized",
          hint: "Run: apps/business-os/scripts/setup-worktree.sh",
        },
        { status: 500 }
      );
    }

    // Perform sync
    const result = await writer.sync();

    if (!result.success) {
      if (result.needsManualResolution) {
        return NextResponse.json(
          {
            error: result.error,
            needsManualResolution: true,
            hint: "Resolve conflicts manually in the worktree, then try again",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: result.error || "Sync failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pushed: result.pushed,
      commitCount: result.commitCount,
      compareUrl: result.compareUrl,
      findPrUrl: result.findPrUrl,
      message: "Changes pushed. Check PR links to verify auto-merge status.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
