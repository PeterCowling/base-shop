/**
 * Business OS repository writer with git integration
 *
 * Phase 0: Local-only, dedicated worktree, work/business-os-store branch
 */

import path from "node:path";

import matter from "gray-matter";
import simpleGit, { type SimpleGit } from "simple-git";

import { authorizeWrite } from "./auth/authorize";
import {
  type CommitIdentity,
  getGitAuthorOptions,
} from "./commit-identity";
import {
  accessWithinRoot,
  mkdirWithinRoot,
  readFileWithinRoot,
  writeFileWithinRoot,
} from "./safe-fs";
import type { CardFrontmatter, IdeaFrontmatter } from "./types";

export interface WriteResult {
  success: boolean;
  filePath?: string;
  commitHash?: string;
  errorKey?: string;
  errorDetails?: string;
  needsManualResolution?: boolean;
}

export interface SyncResult {
  success: boolean;
  pushed: boolean;
  commitCount?: number;
  compareUrl?: string;
  findPrUrl?: string;
  errorKey?: string;
  errorDetails?: string;
  needsManualResolution?: boolean;
}

const repoWriterErrorKeys = {
  worktreeUncommitted: "businessOs.repoWriter.errors.worktreeUncommitted",
  worktreeConflict: "businessOs.repoWriter.errors.worktreeConflict",
  worktreeStatusFailed: "businessOs.repoWriter.errors.worktreeStatusFailed",
  writeAccessDenied: "businessOs.api.common.writeAccessDenied",
  writeIdeaFailed: "businessOs.repoWriter.errors.writeIdeaFailed",
  writeCardFailed: "businessOs.repoWriter.errors.writeCardFailed",
  updateCardFailed: "businessOs.repoWriter.errors.updateCardFailed",
  cardNotFound: "businessOs.repoWriter.errors.cardNotFound",
  mergeConflictWorkBranch:
    "businessOs.repoWriter.errors.mergeConflictWorkBranch",
  mergeConflictMain: "businessOs.repoWriter.errors.mergeConflictMain",
  pushFailedAfterRetry: "businessOs.repoWriter.errors.pushFailedAfterRetry",
  syncFailed: "businessOs.repoWriter.errors.syncFailed",
} as const;

/**
 * Repository writer for Business OS documents
 *
 * Phase 0: Uses dedicated worktree and work/business-os-store branch
 */
export class RepoWriter {
  private git: SimpleGit;
  private worktreePath: string;
  private repoRoot: string;
  private workBranch = "work/business-os-store";

  constructor(repoRoot: string, worktreePath?: string) {
    this.repoRoot = repoRoot;
    // Default worktree path: ../base-shop-business-os-store/
    this.worktreePath =
      worktreePath ||
      path.join(repoRoot, "../base-shop-business-os-store");
    // Initialize git instance (may not exist yet)
    try {
      this.git = simpleGit(this.worktreePath);
    } catch {
      // Worktree doesn't exist - will be caught by isWorktreeReady
      this.git = simpleGit();
    }
  }

  /**
   * Check if worktree is initialized and ready
   */
  async isWorktreeReady(): Promise<boolean> {
    try {
      // Check if worktree directory exists
      await accessWithinRoot(this.worktreePath, this.worktreePath);

      // Re-initialize git with correct path if needed
      this.git = simpleGit(this.worktreePath);

      // Check if it's a git repository
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        return false;
      }

      // Check if it's on the correct branch
      const status = await this.git.status();
      return status.current === this.workBranch;
    } catch {
      return false;
    }
  }

  /**
   * Check if worktree is clean (no uncommitted changes, not mid-merge)
   */
  async isWorktreeClean(): Promise<{
    clean: boolean;
    errorKey?: string;
    errorDetails?: string;
  }> {
    try {
      const status = await this.git.status();

      // Check for uncommitted changes
      if (
        status.files.length > 0 ||
        status.staged.length > 0 ||
        status.modified.length > 0
      ) {
        return {
          clean: false,
          errorKey: repoWriterErrorKeys.worktreeUncommitted,
        };
      }

      // Check for mid-merge state
      if (status.conflicted.length > 0) {
        return {
          clean: false,
          errorKey: repoWriterErrorKeys.worktreeConflict,
        };
      }

      return { clean: true };
    } catch (error) {
      return {
        clean: false,
        errorKey: repoWriterErrorKeys.worktreeStatusFailed,
        errorDetails: String(error),
      };
    }
  }

  /**
   * Write an idea to inbox
   */
  async writeIdea(
    idea: Omit<IdeaFrontmatter, "Type"> & { content: string },
    identity: CommitIdentity
  ): Promise<WriteResult> {
    const relativePath = `docs/business-os/ideas/inbox/${idea.ID}.user.md`;
    const absolutePath = path.join(this.worktreePath, relativePath);

    // Check authorization
    if (!authorizeWrite(absolutePath, this.repoRoot)) {
      return {
        success: false,
        errorKey: repoWriterErrorKeys.writeAccessDenied,
      };
    }

    // Check worktree is clean
    const cleanCheck = await this.isWorktreeClean();
    if (!cleanCheck.clean) {
      return {
        success: false,
        errorKey: cleanCheck.errorKey,
        errorDetails: cleanCheck.errorDetails,
        needsManualResolution: true,
      };
    }

    try {
      // Prepare frontmatter
      const frontmatter: IdeaFrontmatter = {
        Type: "Idea",
        ...idea,
      };

      // Create markdown with frontmatter
      const fileContent = matter.stringify(idea.content, frontmatter);

      // Ensure directory exists
      await mkdirWithinRoot(this.worktreePath, path.dirname(absolutePath), {
        recursive: true,
      });

      // Write file
      await writeFileWithinRoot(this.worktreePath, absolutePath, fileContent, "utf-8");

      // Git add and commit
      await this.git.add(relativePath);
      const commitResult = await this.git.commit(
        `Add idea: ${idea.ID}`,
        undefined,
        getGitAuthorOptions(identity)
      );

      return {
        success: true,
        filePath: relativePath,
        commitHash: commitResult.commit,
      };
    } catch (error) {
      return {
        success: false,
        errorKey: repoWriterErrorKeys.writeIdeaFailed,
        errorDetails: String(error),
      };
    }
  }

  /**
   * Write a card
   */
  async writeCard(
    card: Omit<CardFrontmatter, "Type"> & { content: string },
    identity: CommitIdentity
  ): Promise<WriteResult> {
    const relativePath = `docs/business-os/cards/${card.ID}.user.md`;
    const absolutePath = path.join(this.worktreePath, relativePath);

    // Check authorization
    if (!authorizeWrite(absolutePath, this.repoRoot)) {
      return {
        success: false,
        errorKey: repoWriterErrorKeys.writeAccessDenied,
      };
    }

    // Check worktree is clean
    const cleanCheck = await this.isWorktreeClean();
    if (!cleanCheck.clean) {
      return {
        success: false,
        errorKey: cleanCheck.errorKey,
        errorDetails: cleanCheck.errorDetails,
        needsManualResolution: true,
      };
    }

    try {
      // Prepare frontmatter
      const frontmatter: CardFrontmatter = {
        Type: "Card",
        ...card,
      };

      // Create markdown with frontmatter
      const fileContent = matter.stringify(card.content, frontmatter);

      // Ensure directory exists
      await mkdirWithinRoot(this.worktreePath, path.dirname(absolutePath), {
        recursive: true,
      });

      // Write file
      await writeFileWithinRoot(this.worktreePath, absolutePath, fileContent, "utf-8");

      // Git add and commit
      await this.git.add(relativePath);
      const commitResult = await this.git.commit(
        `Add card: ${card.ID}`,
        undefined,
        getGitAuthorOptions(identity)
      );

      return {
        success: true,
        filePath: relativePath,
        commitHash: commitResult.commit,
      };
    } catch (error) {
      return {
        success: false,
        errorKey: repoWriterErrorKeys.writeCardFailed,
        errorDetails: String(error),
      };
    }
  }

  /**
   * Update an existing card
   */
  async updateCard(
    cardId: string,
    updates: Partial<CardFrontmatter> & { content?: string },
    identity: CommitIdentity
  ): Promise<WriteResult> {
    const relativePath = `docs/business-os/cards/${cardId}.user.md`;
    const absolutePath = path.join(this.worktreePath, relativePath);

    // Check authorization
    if (!authorizeWrite(absolutePath, this.repoRoot)) {
      return {
        success: false,
        errorKey: repoWriterErrorKeys.writeAccessDenied,
      };
    }

    // Check worktree is clean
    const cleanCheck = await this.isWorktreeClean();
    if (!cleanCheck.clean) {
      return {
        success: false,
        errorKey: cleanCheck.errorKey,
        errorDetails: cleanCheck.errorDetails,
        needsManualResolution: true,
      };
    }

    try {
      // Read existing file
      const existingContent = (await readFileWithinRoot(
        this.worktreePath,
        absolutePath,
        "utf-8"
      )) as string;
      const parsed = matter(existingContent);

      // Merge updates
      const updatedFrontmatter = {
        ...parsed.data,
        ...updates,
        Updated: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      };
      const updatedContent = updates.content ?? parsed.content;

      // Create updated markdown
      const fileContent = matter.stringify(updatedContent, updatedFrontmatter);

      // Write file
      await writeFileWithinRoot(this.worktreePath, absolutePath, fileContent, "utf-8");

      // Git add and commit
      await this.git.add(relativePath);
      const commitResult = await this.git.commit(
        `Update card: ${cardId}`,
        undefined,
        getGitAuthorOptions(identity)
      );

      return {
        success: true,
        filePath: relativePath,
        commitHash: commitResult.commit,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {
          success: false,
          errorKey: repoWriterErrorKeys.cardNotFound,
        };
      }

      return {
        success: false,
        errorKey: repoWriterErrorKeys.updateCardFailed,
        errorDetails: String(error),
      };
    }
  }

  /**
   * Sync worktree to remote (push)
   *
   * Phase 0: Fetch, merge remote work branch, merge main, push
   * Returns links for user to check PR status (no GitHub API polling)
   */
  async sync(): Promise<SyncResult> {
    // Check worktree is clean
    const cleanCheck = await this.isWorktreeClean();
    if (!cleanCheck.clean) {
      return {
        success: false,
        pushed: false,
        errorKey: cleanCheck.errorKey,
        errorDetails: cleanCheck.errorDetails,
        needsManualResolution: true,
      };
    }

    try {
      // 1. Fetch from origin
      await this.git.fetch("origin");

      // 2. Ensure we're on work branch
      const status = await this.git.status();
      if (status.current !== this.workBranch) {
        await this.git.checkout(this.workBranch);
      }

      // 3. Merge remote work branch if it exists
      try {
        await this.git.merge([`origin/${this.workBranch}`]);
      } catch {
        // Check if it's a conflict
        const statusAfterMerge = await this.git.status();
        if (statusAfterMerge.conflicted.length > 0) {
          return {
            success: false,
            pushed: false,
            errorKey: repoWriterErrorKeys.mergeConflictWorkBranch,
            needsManualResolution: true,
          };
        }
        // If remote branch doesn't exist yet, that's OK (first push)
      }

      // 4. Merge main into work branch
      try {
        await this.git.merge(["origin/main"]);
      } catch (mergeError) {
        // Check if it's a conflict
        const statusAfterMerge = await this.git.status();
        if (statusAfterMerge.conflicted.length > 0) {
          return {
            success: false,
            pushed: false,
            errorKey: repoWriterErrorKeys.mergeConflictMain,
            needsManualResolution: true,
          };
        }
        throw mergeError;
      }

      // 5. Get commit count before push
      const log = await this.git.log();
      const commitCount = log.total;

      // 6. Push work branch
      try {
        await this.git.push("origin", this.workBranch, ["--set-upstream"]);
      } catch {
        // Retry once if non-fast-forward
        try {
          await this.git.fetch("origin");
          await this.git.merge([`origin/${this.workBranch}`]);
          await this.git.push("origin", this.workBranch);
        } catch (retryError) {
          return {
            success: false,
            pushed: false,
            errorKey: repoWriterErrorKeys.pushFailedAfterRetry,
            errorDetails: String(retryError),
            needsManualResolution: true,
          };
        }
      }

      // Generate PR links (no GitHub API)
      const owner = "PeterCowling"; // Phase 0: hardcoded
      const repo = "base-shop";
      const compareUrl = `https://github.com/${owner}/${repo}/compare/main...${this.workBranch}`;
      const findPrUrl = `https://github.com/${owner}/${repo}/pulls?q=is%3Apr+head%3A${encodeURIComponent(this.workBranch)}`;

      return {
        success: true,
        pushed: true,
        commitCount,
        compareUrl,
        findPrUrl,
      };
    } catch (error) {
      return {
        success: false,
        pushed: false,
        errorKey: repoWriterErrorKeys.syncFailed,
        errorDetails: String(error),
      };
    }
  }
}

/**
 * Create a RepoWriter instance
 */
export function createRepoWriter(
  repoRoot: string,
  worktreePath?: string
): RepoWriter {
  return new RepoWriter(repoRoot, worktreePath);
}
