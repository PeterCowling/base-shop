/**
 * Git history utilities for Business OS
 * BOS-28: Lightweight history view for cards
 */

import simpleGit, { type DefaultLogFields, type ListLogLine } from "simple-git";

export interface CommitHistoryEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
  authorEmail: string;
}

/**
 * Get git history for a file
 *
 * @param repoPath - Path to git repository
 * @param filePath - Relative path to file from repo root
 * @param limit - Maximum number of commits to return (default: 10)
 * @returns Array of commit history entries
 */
export async function getFileHistory(
  repoPath: string,
  filePath: string,
  limit = 10
): Promise<CommitHistoryEntry[]> {
  try {
    const git = simpleGit(repoPath);

    // Check if repo is valid
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return [];
    }

    // Get git log for the file
    const log = await git.log({
      file: filePath,
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
    // Log error but don't throw - history view is non-critical
    console.error(`Failed to get git history for ${filePath}:`, error);
    return [];
  }
}

/**
 * Get GitHub URL for file history (if configured)
 *
 * Phase 0: Hardcoded for base-shop repo
 */
export function getGitHubHistoryUrl(
  filePath: string,
  owner = "PeterCowling",
  repo = "base-shop"
): string {
  const encodedPath = encodeURIComponent(filePath);
  return `https://github.com/${owner}/${repo}/commits/main/${encodedPath}`;
}
