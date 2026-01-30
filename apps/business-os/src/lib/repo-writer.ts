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
  buildAuditCommitMessage,
  type CommitIdentity,
  getGitAuthorOptions,
} from "./commit-identity";
import { RepoLock } from "./repo";
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
  updateIdeaFailed: "businessOs.repoWriter.errors.updateIdeaFailed",
  cardNotFound: "businessOs.repoWriter.errors.cardNotFound",
  ideaNotFound: "businessOs.repoWriter.errors.ideaNotFound",
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
  private lock: RepoLock;
  private lockEnabled: boolean;

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

    // MVP-C1: Initialize repo lock
    const lockDir = path.join(repoRoot, "docs/business-os/.locks");
    this.lock = new RepoLock(lockDir);
    this.lockEnabled = process.env.BUSINESS_OS_REPO_LOCK_ENABLED === "true";
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
   * MVP-B3: Includes audit attribution (actor/initiator)
   */
  async writeIdea(
    idea: Omit<IdeaFrontmatter, "Type"> & { content: string },
    identity: CommitIdentity,
    actor: string,
    initiator: string
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

    // MVP-C1: Define write operation
    const writeOperation = async (): Promise<WriteResult> => {
      try {
        // Prepare frontmatter
        const frontmatter: IdeaFrontmatter = { Type: "Idea", ...idea };

        // Create markdown with frontmatter
        const fileContent = matter.stringify(idea.content, frontmatter);

        // Ensure directory exists
        await mkdirWithinRoot(this.worktreePath, path.dirname(absolutePath), { recursive: true });

        // Write file
        await writeFileWithinRoot(this.worktreePath, absolutePath, fileContent, "utf-8");

        // Git add and commit (MVP-B3: Audit attribution)
        await this.git.add(relativePath);
        const entityId = idea.ID || "UNKNOWN";
        const commitMessage = buildAuditCommitMessage({ actor, initiator, entityId, action: `Add idea: ${entityId}` });
        const commitResult = await this.git.commit(commitMessage, undefined, getGitAuthorOptions(identity));

        return { success: true, filePath: relativePath, commitHash: commitResult.commit };
      } catch (error) {
        return { success: false, errorKey: repoWriterErrorKeys.writeIdeaFailed, errorDetails: String(error) };
      }
    };

    // Execute with or without lock
    if (this.lockEnabled) {
      try {
        return await this.lock.withLock({ userId: actor, action: "write-idea" }, writeOperation);
      } catch (error) {
        return { success: false, errorKey: repoWriterErrorKeys.writeIdeaFailed, errorDetails: String(error) };
      }
    } else {
      return writeOperation();
    }
  }

  /**
   * Write a card
   * MVP-B3: Includes audit attribution (actor/initiator)
   */
  async writeCard(
    card: Omit<CardFrontmatter, "Type"> & { content: string },
    identity: CommitIdentity,
    actor: string,
    initiator: string
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

    // MVP-C1: Define write operation
    const writeOperation = async (): Promise<WriteResult> => {
      try {
        // Prepare frontmatter
        const frontmatter: CardFrontmatter = { Type: "Card", ...card };

        // Create markdown with frontmatter
        const fileContent = matter.stringify(card.content, frontmatter);

        // Ensure directory exists
        await mkdirWithinRoot(this.worktreePath, path.dirname(absolutePath), { recursive: true });

        // Write file
        await writeFileWithinRoot(this.worktreePath, absolutePath, fileContent, "utf-8");

        // Git add and commit (MVP-B3: Audit attribution)
        await this.git.add(relativePath);
        const commitMessage = buildAuditCommitMessage({ actor, initiator, entityId: card.ID, action: `Add card: ${card.ID}` });
        const commitResult = await this.git.commit(commitMessage, undefined, getGitAuthorOptions(identity));

        return { success: true, filePath: relativePath, commitHash: commitResult.commit };
      } catch (error) {
        return { success: false, errorKey: repoWriterErrorKeys.writeCardFailed, errorDetails: String(error) };
      }
    };

    // Execute with or without lock
    if (this.lockEnabled) {
      try {
        return await this.lock.withLock({ userId: actor, action: "write-card" }, writeOperation);
      } catch (error) {
        return { success: false, errorKey: repoWriterErrorKeys.writeCardFailed, errorDetails: String(error) };
      }
    } else {
      return writeOperation();
    }
  }

  /**
   * Update an existing card
   * MVP-B3: Includes audit attribution (actor/initiator)
   */
  async updateCard(
    cardId: string,
    updates: Partial<CardFrontmatter> & { content?: string },
    identity: CommitIdentity,
    actor: string,
    initiator: string
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

    // MVP-C1: Define write operation
    const writeOperation = async (): Promise<WriteResult> => {
      try {
        // Read existing file
        const existingContent = (await readFileWithinRoot(this.worktreePath, absolutePath, "utf-8")) as string;
        const parsed = matter(existingContent);

        // Merge updates
        const updatedFrontmatter = { ...parsed.data, ...updates, Updated: new Date().toISOString().split("T")[0] };
        const updatedContent = updates.content ?? parsed.content;

        // Create updated markdown
        const fileContent = matter.stringify(updatedContent, updatedFrontmatter);

        // Write file
        await writeFileWithinRoot(this.worktreePath, absolutePath, fileContent, "utf-8");

        // Git add and commit (MVP-B3: Audit attribution)
        await this.git.add(relativePath);
        const commitMessage = buildAuditCommitMessage({ actor, initiator, entityId: cardId, action: `Update card: ${cardId}` });
        const commitResult = await this.git.commit(commitMessage, undefined, getGitAuthorOptions(identity));

        return { success: true, filePath: relativePath, commitHash: commitResult.commit };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return { success: false, errorKey: repoWriterErrorKeys.cardNotFound };
        }
        return { success: false, errorKey: repoWriterErrorKeys.updateCardFailed, errorDetails: String(error) };
      }
    };

    // Execute with or without lock
    if (this.lockEnabled) {
      try {
        return await this.lock.withLock({ userId: actor, action: "update-card" }, writeOperation);
      } catch (error) {
        return { success: false, errorKey: repoWriterErrorKeys.updateCardFailed, errorDetails: String(error) };
      }
    } else {
      return writeOperation();
    }
  }

  /**
   * Update an existing idea
   * MVP-B3: Includes audit attribution (actor/initiator)
   */
  async updateIdea(
    ideaId: string,
    updates: Partial<IdeaFrontmatter> & { content?: string },
    identity: CommitIdentity,
    actor: string,
    initiator: string
  ): Promise<WriteResult> {
    const relativePath = `docs/business-os/ideas/inbox/${ideaId}.user.md`;
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

    // MVP-C1: Define write operation
    const writeOperation = async (): Promise<WriteResult> => {
      try {
        // Read existing file
        const existingContent = (await readFileWithinRoot(this.worktreePath, absolutePath, "utf-8")) as string;
        const parsed = matter(existingContent);

        // Merge updates
        const updatedFrontmatter = { ...parsed.data, ...updates, "Last-Updated": new Date().toISOString().split("T")[0] };
        const updatedContent = updates.content ?? parsed.content;

        // Create updated markdown
        const fileContent = matter.stringify(updatedContent, updatedFrontmatter);

        // Write file
        await writeFileWithinRoot(this.worktreePath, absolutePath, fileContent, "utf-8");

        // Git add and commit (MVP-B3: Audit attribution)
        await this.git.add(relativePath);
        const commitMessage = buildAuditCommitMessage({ actor, initiator, entityId: ideaId, action: `Update idea: ${ideaId}` });
        const commitResult = await this.git.commit(commitMessage, undefined, getGitAuthorOptions(identity));

        return { success: true, filePath: relativePath, commitHash: commitResult.commit };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return { success: false, errorKey: repoWriterErrorKeys.ideaNotFound };
        }
        return { success: false, errorKey: repoWriterErrorKeys.updateIdeaFailed, errorDetails: String(error) };
      }
    };

    // Execute with or without lock
    if (this.lockEnabled) {
      try {
        return await this.lock.withLock({ userId: actor, action: "update-idea" }, writeOperation);
      } catch (error) {
        return { success: false, errorKey: repoWriterErrorKeys.updateIdeaFailed, errorDetails: String(error) };
      }
    } else {
      return writeOperation();
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
