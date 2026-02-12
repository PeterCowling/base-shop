/**
 * CommitReader - Parse git log for commit-to-card linking
 * MVP-F1: When agent commits code mentioning card ID, card shows progress automatically
 */

import simpleGit, { type DefaultLogFields, type ListLogLine } from "simple-git";

export interface CommitEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
  authorEmail: string;
}

/**
 * Extract card IDs from commit message
 * Supports patterns like: BRIK-001, PLAT-123, etc.
 * Pattern: {2+ uppercase letters}-{digits}
 */
export function extractCardIds(message: string): string[] {
  const regex = /([A-Z]{2,}-\d+)/g;
  const matches = message.match(regex);
  return matches || [];
}

/**
 * Get commits that mention a specific card ID
 *
 * @param repoPath - Path to git repository
 * @param cardId - Card ID to search for (e.g., "BRIK-001")
 * @param limit - Maximum number of commits to return (default: 10)
 * @returns Array of commits mentioning the card ID
 */
export async function getCommitsForCard(
  repoPath: string,
  cardId: string,
  limit = 10
): Promise<CommitEntry[]> {
  try {
    const git = simpleGit(repoPath);

    // Check if repo is valid
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return [];
    }

    // Search git log for commits mentioning the card ID
    // Use --all to search all branches, --grep to filter by message
    const log = await git.log({
      "--all": null,
      "--grep": cardId,
      maxCount: limit,
    });

    // Transform to our format
    return log.all.map((commit: DefaultLogFields & ListLogLine) => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: commit.date,
      authorEmail: commit.author_email,
    }));
  } catch (error) {
    // Log error but don't throw - activity view is non-critical
    if (process.env.NODE_ENV !== "test") {
      console.error(`Failed to get commits for card ${cardId}:`, error);
    }
    return [];
  }
}
