import * as fs from "fs/promises";
import * as path from "path";

import matter from "gray-matter";
import simpleGit, { type SimpleGit } from "simple-git";

import { authorizeWrite } from "../auth/authorize";
import {
  buildAuditCommitMessage,
  type CommitIdentity,
  getGitAuthorOptions,
} from "../commit-identity";
import type { WriteResult } from "../repo-writer";
import type { RepoLock } from "./RepoLock";

export type AgentAction = "work-idea" | "break-into-tasks" | "draft-plan" | "custom";

export interface AgentQueueItemFrontmatter {
  Type: "Agent-Queue-Item";
  Action: AgentAction;
  Target: string; // Entity ID (e.g., "BRIK-001", "BRIK-OPP-001")
  "Target-Type": "card" | "idea";
  Initiator: string; // User who requested
  Status: "pending" | "in-progress" | "completed" | "failed";
  Created: string; // ISO timestamp
  Instructions?: string; // Optional custom instructions
}

export interface AgentQueueItem extends AgentQueueItemFrontmatter {
  content: string;
  queueId: string;
}

/**
 * AgentQueueWriter - Creates agent queue items as git artifacts
 * MVP-E2: Enable users to request agent work via UI
 */
export class AgentQueueWriter {
  private git: SimpleGit;

  constructor(
    private worktreePath: string,
    private repoRoot: string,
    private lock: RepoLock,
    private lockEnabled: boolean = true
  ) {
    this.git = simpleGit(worktreePath);
  }

  /**
   * Create a new agent queue item
   * Stores in docs/business-os/agent-queue/{queueId}.md
   */
  async createQueueItem(
    action: AgentAction,
    target: string,
    targetType: "card" | "idea",
    initiator: string,
    identity: CommitIdentity,
    actor: string,
    content?: string,
    instructions?: string
  ): Promise<WriteResult & { queueId?: string }> {
    // Generate unique queue ID with timestamp + random suffix
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const queueId = `${target}-${timestamp}-${randomSuffix}`;

    const relativePath = `docs/business-os/agent-queue/${queueId}.md`;
    const absolutePath = path.join(this.worktreePath, relativePath);

    // Check authorization
    if (!authorizeWrite(absolutePath, this.repoRoot)) {
      return {
        success: false,
        errorKey: "businessOs.agentQueue.errors.writeAccessDenied",
      };
    }

    const writeOperation = async (): Promise<WriteResult & { queueId?: string }> => {
      try {
        // Ensure agent-queue directory exists
        const queueDir = path.join(this.worktreePath, "docs/business-os/agent-queue");
        await fs.mkdir(queueDir, { recursive: true });

        // Create frontmatter
        const frontmatter: AgentQueueItemFrontmatter = {
          Type: "Agent-Queue-Item",
          Action: action,
          Target: target,
          "Target-Type": targetType,
          Initiator: initiator,
          Status: "pending",
          Created: new Date().toISOString(),
          ...(instructions && { Instructions: instructions }),
        };

        // Generate markdown content
        const markdownContent = matter.stringify(
          content || `Agent task requested: ${action} for ${target}`,
          frontmatter
        );

        // Write file
        await fs.writeFile(absolutePath, markdownContent, "utf-8");

        // Git add and commit (MVP-B3: Audit attribution)
        await this.git.add(relativePath);
        const commitMessage = buildAuditCommitMessage({
          actor,
          initiator: actor,
          entityId: queueId,
          action: `Request agent: ${action} for ${target}`,
        });
        const commitResult = await this.git.commit(
          commitMessage,
          undefined,
          getGitAuthorOptions(identity)
        );

        return {
          success: true,
          filePath: relativePath,
          commitHash: commitResult.commit,
          queueId,
        };
      } catch (error) {
        return {
          success: false,
          errorKey: "businessOs.agentQueue.errors.createFailed",
          errorDetails: String(error),
        };
      }
    };

    // Execute with or without lock
    if (this.lockEnabled) {
      try {
        return await this.lock.withLock(
          { userId: actor, action: "create-queue-item" },
          writeOperation
        );
      } catch (error) {
        return {
          success: false,
          errorKey: "businessOs.agentQueue.errors.createFailed",
          errorDetails: String(error),
        };
      }
    } else {
      return writeOperation();
    }
  }
}
