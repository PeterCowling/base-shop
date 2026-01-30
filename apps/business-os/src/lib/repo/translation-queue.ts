/* eslint-disable simple-import-sort/imports -- BOS-04 MVP-G1 i18n translation queue [ttl=2026-02-28] */
import path from "node:path";

import type { CommitIdentity } from "../commit-identity";
import { getRepoRoot } from "../get-repo-root";
import { AgentQueueWriter } from "./AgentQueueWriter";
import { RepoLock } from "./RepoLock";
/* eslint-enable simple-import-sort/imports */

/**
 * Translation queue helper
 * MVP-G1: Queue translation tasks for cards and worked ideas
 */

export interface QueueTranslationOptions {
  targetId: string;
  targetType: "card" | "idea";
  initiator: string;
  identity: CommitIdentity;
  actor: string;
}

/**
 * Queue a translation task for an entity
 * Creates an agent queue item with action="translate"
 *
 * Only queues if:
 * - BUSINESS_OS_I18N_ENABLED is true
 * - For ideas: Status is "worked" (not "raw")
 */
export async function queueTranslation(
  options: QueueTranslationOptions
): Promise<{ success: boolean; queueId?: string; errorKey?: string }> {
  // Check feature flag
  const i18nEnabled = process.env.BUSINESS_OS_I18N_ENABLED === "true";
  if (!i18nEnabled) {
    return { success: true }; // Silently skip if disabled
  }

  const repoRoot = getRepoRoot();
  const worktreePath = path.join(repoRoot, "../base-shop-business-os-store");
  const lockDir = path.join(repoRoot, "docs/business-os/.locks");
  const lock = new RepoLock(lockDir);

  const lockEnabled = process.env.BUSINESS_OS_REPO_LOCK_ENABLED === "true";
  const queueWriter = new AgentQueueWriter(
    worktreePath,
    repoRoot,
    lock,
    lockEnabled
  );

  // Create translation queue item
  const result = await queueWriter.createQueueItem(
    "custom", // Use "custom" action type for translation
    options.targetId,
    options.targetType,
    options.initiator,
    options.identity,
    options.actor,
    `Translate ${options.targetType} ${options.targetId} to Italian`,
    "translate-to-it" // Custom instruction for agent
  );

  return result;
}
