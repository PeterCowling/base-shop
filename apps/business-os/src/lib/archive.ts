/**
 * Archive mechanism for Business OS
 * BOS-17: Move items to archive/ and hide from UI
 */

import path from "node:path";

import matter from "gray-matter";
import simpleGit from "simple-git";

import { withBaseShopWriterLock } from "./base-shop-writer-lock";
import { type CommitIdentity, getGitAuthorOptions } from "./commit-identity";
import {
  accessWithinRoot,
  mkdirWithinRoot,
  readFileWithinRoot,
  unlinkWithinRoot,
  writeFileWithinRoot,
} from "./safe-fs";

export type ArchiveItemType = "card" | "idea";

export interface ArchiveResult {
  success: boolean;
  archivedPath?: string;
  commitHash?: string;
  error?: string;
}

/**
 * Archive a card or idea
 *
 * Moves file to archive/ subdirectory and updates Status to "Archived"
 *
 * @param repoRoot - Path to repository root
 * @param type - Type of item to archive
 * @param id - Item ID (for cards) or filename (for ideas)
 * @param location - Location for ideas: "inbox" or "worked"
 * @param identity - Commit identity
 */
export async function archiveItem(
  repoRoot: string,
  type: ArchiveItemType,
  id: string,
  identity: CommitIdentity,
  location?: "inbox" | "worked"
): Promise<ArchiveResult> {
  return withBaseShopWriterLock(
    repoRoot,
    `business-os:archive:${type}:${id}`,
    async () => {
      try {
        const git = simpleGit(repoRoot);

        // Determine source and destination paths
        let sourcePath: string;
        let destPath: string;

        if (type === "card") {
          sourcePath = `docs/business-os/cards/${id}.user.md`;
          destPath = `docs/business-os/cards/archive/${id}.user.md`;
        } else if (type === "idea") {
          if (!location) {
            return {
              success: false,
              error: "Location is required for ideas (inbox or worked)",
            };
          }
          sourcePath = `docs/business-os/ideas/${location}/${id}`;
          destPath = `docs/business-os/ideas/${location}/archive/${id}`;
        } else {
          return {
            success: false,
            error: `Unknown archive type: ${type}`,
          };
        }

        const absoluteSourcePath = path.join(repoRoot, sourcePath);
        const absoluteDestPath = path.join(repoRoot, destPath);

        // Check if source file exists
        try {
          await accessWithinRoot(repoRoot, absoluteSourcePath);
        } catch {
          return {
            success: false,
            error: `File not found: ${sourcePath}`,
          };
        }

        // Read and update frontmatter
        const content = (await readFileWithinRoot(
          repoRoot,
          absoluteSourcePath,
          "utf-8"
        )) as string;
        const parsed = matter(content);

        // Update status to Archived
        parsed.data.Status = "Archived";
        const updatedContent = matter.stringify(parsed.content, parsed.data);

        // Ensure archive directory exists
        await mkdirWithinRoot(repoRoot, path.dirname(absoluteDestPath), {
          recursive: true,
        });

        // Write updated content to new location
        await writeFileWithinRoot(
          repoRoot,
          absoluteDestPath,
          updatedContent,
          "utf-8"
        );

        // Remove original file
        await unlinkWithinRoot(repoRoot, absoluteSourcePath);

        // Git operations: add new, remove old, commit
        // These may fail in test environments without proper git setup
        let commitHash: string | undefined;
        try {
          await git.add(destPath);
          await git.rm(sourcePath);

          const commitMessage =
            type === "card"
              ? `Archive card: ${id}`
              : `Archive idea: ${path.basename(id)}`;

          const commitResult = await git.commit(
            commitMessage,
            undefined,
            getGitAuthorOptions(identity)
          );

          commitHash = commitResult.commit;
        } catch (gitError) {
          // Git operations failed - file operations still succeeded
          if (process.env.NODE_ENV !== "test") {
            console.warn("Git operations failed during archive:", gitError);
          }
        }

        return {
          success: true,
          archivedPath: destPath,
          commitHash,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to archive: ${error}`,
        };
      }
    }
  );
}

/**
 * Check if an item is archived based on its file path
 */
export function isArchived(filePath: string): boolean {
  return filePath.includes("/archive/");
}

/**
 * Filter out archived items from a list
 */
export function filterArchived<T extends { filePath: string }>(
  items: T[]
): T[] {
  return items.filter((item) => !isArchived(item.filePath));
}
