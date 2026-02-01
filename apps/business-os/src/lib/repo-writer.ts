/**
 * Business OS repository writer with git integration
 *
 * Phase 0: Local-only, single checkout, dev branch
 */

import path from "node:path";

import matter from "gray-matter";
import simpleGit, { type SimpleGit } from "simple-git";

import { authorizeWrite } from "./auth/authorize";
import { withBaseShopWriterLock } from "./base-shop-writer-lock";
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
 * Phase 0: Uses repo checkout and dev branch
 */
export class RepoWriter {
  private git: SimpleGit | null;
  private repoRoot: string;
  private writeBranch: string;
  private lock: RepoLock;
  private lockEnabled: boolean;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.writeBranch = process.env.BUSINESS_OS_WRITE_BRANCH || "dev";

    this.git = null;

    // MVP-C1: Initialize repo lock
    const lockDir = path.join(repoRoot, "docs/business-os/.locks");
    this.lock = new RepoLock(lockDir);
    this.lockEnabled = process.env.BUSINESS_OS_REPO_LOCK_ENABLED === "true";
  }

  private getGit(): SimpleGit {
    if (!this.git) {
      this.git = simpleGit(this.repoRoot);
    }
    return this.git;
  }

  /**
   * Check if repo is initialized and ready
   */
  async isRepoReady(): Promise<boolean> {
    try {
      // Check if repo directory exists
      await accessWithinRoot(this.repoRoot, this.repoRoot);

      // Check if it's a git repository
      const git = this.getGit();
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return false;
      }

      // Check if it's on the correct branch
      const status = await git.status();
      return status.current === this.writeBranch;
    } catch {
      return false;
    }
  }

  /**
   * Check if repo is clean (no uncommitted changes, not mid-merge)
   */
  async isRepoClean(): Promise<{
    clean: boolean;
    errorKey?: string;
    errorDetails?: string;
  }> {
    try {
      const status = await this.getGit().status();

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
    const absolutePath = path.join(this.repoRoot, relativePath);

    // Check authorization
    if (!authorizeWrite(absolutePath, this.repoRoot)) {
      return {
        success: false,
        errorKey: repoWriterErrorKeys.writeAccessDenied,
      };
    }

    // Check repo is clean
    const cleanCheck = await this.isRepoClean();
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
        await mkdirWithinRoot(this.repoRoot, path.dirname(absolutePath), {
          recursive: true,
        });

        // Write file
        await writeFileWithinRoot(
          this.repoRoot,
          absolutePath,
          fileContent,
          "utf-8"
        );

        // Git add and commit (MVP-B3: Audit attribution)
        const git = this.getGit();
        await git.add(relativePath);
        const entityId = idea.ID || "UNKNOWN";
        const commitMessage = buildAuditCommitMessage({
          actor,
          initiator,
          entityId,
          action: `Add idea: ${entityId}`,
        });
        const commitResult = await git.commit(
          commitMessage,
          undefined,
          getGitAuthorOptions(identity)
        );

        return { success: true, filePath: relativePath, commitHash: commitResult.commit };
      } catch (error) {
        return { success: false, errorKey: repoWriterErrorKeys.writeIdeaFailed, errorDetails: String(error) };
      }
    };

    return withBaseShopWriterLock(this.repoRoot, `business-os:${actor}:write-idea`, async () => {
      if (this.lockEnabled) {
        try {
          return await this.lock.withLock(
            { userId: actor, action: "write-idea" },
            writeOperation
          );
        } catch (error) {
          return {
            success: false,
            errorKey: repoWriterErrorKeys.writeIdeaFailed,
            errorDetails: String(error),
          };
        }
      }

      return writeOperation();
    });
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
    const absolutePath = path.join(this.repoRoot, relativePath);

    // Check authorization
    if (!authorizeWrite(absolutePath, this.repoRoot)) {
      return {
        success: false,
        errorKey: repoWriterErrorKeys.writeAccessDenied,
      };
    }

    // Check repo is clean
    const cleanCheck = await this.isRepoClean();
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
        await mkdirWithinRoot(this.repoRoot, path.dirname(absolutePath), {
          recursive: true,
        });

        // Write file
        await writeFileWithinRoot(
          this.repoRoot,
          absolutePath,
          fileContent,
          "utf-8"
        );

        // Git add and commit (MVP-B3: Audit attribution)
        const git = this.getGit();
        await git.add(relativePath);
        const commitMessage = buildAuditCommitMessage({
          actor,
          initiator,
          entityId: card.ID,
          action: `Add card: ${card.ID}`,
        });
        const commitResult = await git.commit(
          commitMessage,
          undefined,
          getGitAuthorOptions(identity)
        );

        return { success: true, filePath: relativePath, commitHash: commitResult.commit };
      } catch (error) {
        return { success: false, errorKey: repoWriterErrorKeys.writeCardFailed, errorDetails: String(error) };
      }
    };

    return withBaseShopWriterLock(this.repoRoot, `business-os:${actor}:write-card`, async () => {
      if (this.lockEnabled) {
        try {
          return await this.lock.withLock(
            { userId: actor, action: "write-card" },
            writeOperation
          );
        } catch (error) {
          return {
            success: false,
            errorKey: repoWriterErrorKeys.writeCardFailed,
            errorDetails: String(error),
          };
        }
      }

      return writeOperation();
    });
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
    const absolutePath = path.join(this.repoRoot, relativePath);

    // Check authorization
    if (!authorizeWrite(absolutePath, this.repoRoot)) {
      return {
        success: false,
        errorKey: repoWriterErrorKeys.writeAccessDenied,
      };
    }

    // Check repo is clean
    const cleanCheck = await this.isRepoClean();
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
        const existingContent = (await readFileWithinRoot(
          this.repoRoot,
          absolutePath,
          "utf-8"
        )) as string;
        const parsed = matter(existingContent);

        // Merge updates
        const updatedFrontmatter = { ...parsed.data, ...updates, Updated: new Date().toISOString().split("T")[0] };
        const updatedContent = updates.content ?? parsed.content;

        // Create updated markdown
        const fileContent = matter.stringify(updatedContent, updatedFrontmatter);

        // Write file
        await writeFileWithinRoot(
          this.repoRoot,
          absolutePath,
          fileContent,
          "utf-8"
        );

        // Git add and commit (MVP-B3: Audit attribution)
        const git = this.getGit();
        await git.add(relativePath);
        const commitMessage = buildAuditCommitMessage({
          actor,
          initiator,
          entityId: cardId,
          action: `Update card: ${cardId}`,
        });
        const commitResult = await git.commit(
          commitMessage,
          undefined,
          getGitAuthorOptions(identity)
        );

        return { success: true, filePath: relativePath, commitHash: commitResult.commit };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return { success: false, errorKey: repoWriterErrorKeys.cardNotFound };
        }
        return { success: false, errorKey: repoWriterErrorKeys.updateCardFailed, errorDetails: String(error) };
      }
    };

    return withBaseShopWriterLock(this.repoRoot, `business-os:${actor}:update-card`, async () => {
      if (this.lockEnabled) {
        try {
          return await this.lock.withLock(
            { userId: actor, action: "update-card" },
            writeOperation
          );
        } catch (error) {
          return {
            success: false,
            errorKey: repoWriterErrorKeys.updateCardFailed,
            errorDetails: String(error),
          };
        }
      }

      return writeOperation();
    });
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
    const absolutePath = path.join(this.repoRoot, relativePath);

    // Check authorization
    if (!authorizeWrite(absolutePath, this.repoRoot)) {
      return {
        success: false,
        errorKey: repoWriterErrorKeys.writeAccessDenied,
      };
    }

    // Check repo is clean
    const cleanCheck = await this.isRepoClean();
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
        const existingContent = (await readFileWithinRoot(
          this.repoRoot,
          absolutePath,
          "utf-8"
        )) as string;
        const parsed = matter(existingContent);

        // Merge updates
        const updatedFrontmatter = { ...parsed.data, ...updates, "Last-Updated": new Date().toISOString().split("T")[0] };
        const updatedContent = updates.content ?? parsed.content;

        // Create updated markdown
        const fileContent = matter.stringify(updatedContent, updatedFrontmatter);

        // Write file
        await writeFileWithinRoot(
          this.repoRoot,
          absolutePath,
          fileContent,
          "utf-8"
        );

        // Git add and commit (MVP-B3: Audit attribution)
        const git = this.getGit();
        await git.add(relativePath);
        const commitMessage = buildAuditCommitMessage({
          actor,
          initiator,
          entityId: ideaId,
          action: `Update idea: ${ideaId}`,
        });
        const commitResult = await git.commit(
          commitMessage,
          undefined,
          getGitAuthorOptions(identity)
        );

        return { success: true, filePath: relativePath, commitHash: commitResult.commit };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return { success: false, errorKey: repoWriterErrorKeys.ideaNotFound };
        }
        return { success: false, errorKey: repoWriterErrorKeys.updateIdeaFailed, errorDetails: String(error) };
      }
    };

    return withBaseShopWriterLock(this.repoRoot, `business-os:${actor}:update-idea`, async () => {
      if (this.lockEnabled) {
        try {
          return await this.lock.withLock(
            { userId: actor, action: "update-idea" },
            writeOperation
          );
        } catch (error) {
          return {
            success: false,
            errorKey: repoWriterErrorKeys.updateIdeaFailed,
            errorDetails: String(error),
          };
        }
      }

      return writeOperation();
    });
  }

  /**
   * Sync dev to remote (push)
   *
   * Phase 0: Fetch and push the `dev` branch. A separate pipeline PR ships `dev` → `staging`.
   *
   * Returns links for the user to check PR status (no GitHub API polling).
   */
  async sync(): Promise<SyncResult> {
    // Check repo is clean
    const cleanCheck = await this.isRepoClean();
    if (!cleanCheck.clean) {
      return {
        success: false,
        pushed: false,
        errorKey: cleanCheck.errorKey,
        errorDetails: cleanCheck.errorDetails,
        needsManualResolution: true,
      };
    }

    const syncOperation = async (): Promise<SyncResult> => {
      try {
        const git = this.getGit();

        // 1. Fetch from origin
        await git.fetch("origin");

        // 2. Ensure we're on the write branch (dev)
        const status = await git.status();
        if (status.current !== this.writeBranch) {
          await git.checkout(this.writeBranch);
        }

        // 3. Get commit count before push
        const log = await git.log();
        const commitCount = log.total;

        // 4. Push dev
        try {
          await git.push("origin", this.writeBranch, ["--set-upstream"]);
        } catch {
          // Retry once (fast-forward only) if non-fast-forward / remote advanced.
          try {
            await git.fetch("origin");
            await git.merge(["--ff-only", `origin/${this.writeBranch}`]);
            await git.push("origin", this.writeBranch);
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
        const compareUrl = `https://github.com/${owner}/${repo}/compare/staging...${this.writeBranch}`;
        const findPrUrl = `https://github.com/${owner}/${repo}/pulls?q=is%3Apr+head%3A${encodeURIComponent(this.writeBranch)}+base%3Astaging`;

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
    };

    return withBaseShopWriterLock(this.repoRoot, "business-os:sync", async () => {
      if (this.lockEnabled) {
        try {
          return await this.lock.withLock(
            { userId: "system", action: "sync" },
            syncOperation
          );
        } catch (error) {
          return {
            success: false,
            pushed: false,
            errorKey: repoWriterErrorKeys.syncFailed,
            errorDetails: String(error),
          };
        }
      }
      return syncOperation();
    });
  }
}

/**
 * Create a RepoWriter instance
 */
export function createRepoWriter(repoRoot: string): RepoWriter {
  return new RepoWriter(repoRoot);
}
