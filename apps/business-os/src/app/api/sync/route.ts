import { NextResponse } from "next/server";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { getRepoRoot } from "@/lib/get-repo-root";
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
  const t = await getServerTranslations("en");
  try {
    // Get repo root
    const repoRoot = getRepoRoot();

    // Create writer
    const writer = createRepoWriter(repoRoot);

    // Check if worktree is ready
    const isReady = await writer.isWorktreeReady();
    if (!isReady) {
      return NextResponse.json(
        {
          error: t("businessOs.api.common.worktreeNotInitialized"),
          hint: t("businessOs.api.common.worktreeSetupHint"),
        },
        { status: 500 }
      );
    }

    // Perform sync
    const result = await writer.sync();

    if (!result.success) {
      const errorMessage = result.errorKey
        ? t(result.errorKey)
        : t("businessOs.api.sync.errors.failed");

      if (result.needsManualResolution) {
        return NextResponse.json(
          {
            error: errorMessage,
            needsManualResolution: true,
            hint: t("businessOs.api.common.resolveConflictsRetryHint"),
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pushed: result.pushed,
      commitCount: result.commitCount,
      compareUrl: result.compareUrl,
      findPrUrl: result.findPrUrl,
      message: t("businessOs.api.sync.success.pushed"),
    });
  } catch (error) {
    return NextResponse.json(
      { error: t("api.common.internalServerError"), details: String(error) },
      { status: 500 }
    );
  }
}
