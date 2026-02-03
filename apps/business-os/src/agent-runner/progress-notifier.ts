/**
 * Progress Notifier - Auto-progress notes for agent commits
 * MVP-F2: Agent runner appends progress comments after code commits
 *
 * Feature flag: BUSINESS_OS_AUTO_PROGRESS_NOTES (default: false)
 */

import simpleGit from "simple-git";

import { userToCommitIdentity } from "../lib/commit-identity";
import { USERS } from "../lib/current-user";
import { writeComment } from "../lib/repo/CommentWriter";
import { extractCardIds } from "../lib/repo/CommitReader";

/**
 * Format progress message for comment
 */
export function formatProgressMessage(
  action: string,
  filesChanged: string[],
  commitHash: string
): string {
  const filesSummary =
    filesChanged.length > 3
      ? `${filesChanged.length} files`
      : filesChanged.join(", ");

  return `Agent completed: ${action}. Files changed: ${filesSummary}. Commit: ${commitHash}`;
}

/**
 * Create progress comment for cards mentioned in commit
 */
export async function createProgressComment(
  repoRoot: string,
  commitMessage: string,
  commitHash: string,
  action: string
): Promise<void> {
  // Check feature flag
  const enabled = process.env.BUSINESS_OS_AUTO_PROGRESS_NOTES === "true";
  if (!enabled) {
    return;
  }

  try {
    // Extract card IDs from commit message
    const cardIds = extractCardIds(commitMessage);

    if (cardIds.length === 0) {
      return; // No card IDs to notify
    }

    // Get files changed in commit
    const git = simpleGit(repoRoot);
    const diff = await git.diffSummary([`${commitHash}~1`, commitHash]);
    const filesChanged = diff.files.map((f) => f.file);

    // Create progress message
    const content = formatProgressMessage(action, filesChanged, commitHash);

    // Create comment for each card ID mentioned
    const agentIdentity = userToCommitIdentity(USERS.pete);

    for (const cardId of cardIds) {
      await writeComment(
        repoRoot,
        {
          content,
          entityType: "card",
          entityId: cardId,
          author: "Agent",
        },
        agentIdentity
      );
    }
  } catch (error) {
    // Log error but don't fail the agent task
     
    console.error("[Progress Notifier] Failed to create progress comment:", error);
  }
}
