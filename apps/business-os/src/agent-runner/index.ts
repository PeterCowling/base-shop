#!/usr/bin/env node
/* eslint-disable no-console -- BOS-33 daemon CLI tool requires console output [ttl=2026-03-31] */
/**
 * Agent Runner Daemon
 *
 * MVP-E3: Polls agent queue, executes tasks, writes outputs
 *
 * Usage:
 *   pnpm tsx src/agent-runner/index.ts
 *
 * Environment:
 *   BUSINESS_OS_AGENT_RUNNER_ENABLED - Set to "true" to enable (default: false)
 *   BUSINESS_OS_REPO_ROOT - Path to repository root
 *   BUSINESS_OS_AGENT_COMMAND - Command to execute (default: "claude")
 */

import path from "node:path";

import { withBaseShopWriterLock } from "../lib/base-shop-writer-lock";
import { userToCommitIdentity } from "../lib/commit-identity";
import { USERS } from "../lib/current-user";
import { getRepoRoot } from "../lib/get-repo-root";

import { runClaudeCli } from "./claude-cli";
import { createProgressComment } from "./progress-notifier";
import { QueueScanner, type QueueTask } from "./queue-scanner";
import { RunLogger } from "./run-logger";

const POLL_INTERVAL = 5000; // 5 seconds
const AGENT_USER = USERS.pete; // Agent runs as Pete (admin)

/**
 * Main daemon loop
 */
async function runDaemon() {
  const enabled = process.env.BUSINESS_OS_AGENT_RUNNER_ENABLED === "true";

  if (!enabled) {
    console.log("[Agent Runner] Disabled. Set BUSINESS_OS_AGENT_RUNNER_ENABLED=true to enable.");
    return;
  }

  const repoRoot = getRepoRoot();
  const queueDir = path.join(repoRoot, "docs/business-os/agent-queue");
  const runsDir = path.join(repoRoot, "docs/business-os/agent-runs");

  const scanner = new QueueScanner(queueDir);

  console.log("[Agent Runner] Starting daemon...");
  console.log(`[Agent Runner] Queue directory: ${queueDir}`);
  console.log(`[Agent Runner] Runs directory: ${runsDir}`);
  console.log(`[Agent Runner] Poll interval: ${POLL_INTERVAL}ms`);

  // Poll queue every POLL_INTERVAL ms
  setInterval(async () => {
    try {
      await processQueue(scanner, runsDir, repoRoot);
    } catch (error) {
      console.error("[Agent Runner] Error in poll cycle:", error);
    }
  }, POLL_INTERVAL);

  // Run first check immediately
  await processQueue(scanner, runsDir, repoRoot);

  console.log("[Agent Runner] Daemon running. Press Ctrl+C to stop.");
}

/**
 * Process queue: scan for pending tasks and execute them
 */
async function processQueue(
  scanner: QueueScanner,
  runsDir: string,
  repoRoot: string
): Promise<void> {
  // Scan for pending tasks
  const pending = await scanner.scanQueue("pending");

  if (pending.length === 0) {
    return; // No work to do
  }

  console.log(`[Agent Runner] Found ${pending.length} pending task(s)`);

  // Process oldest task first (FIFO)
  const task = pending[0];

  await executeTask(task, scanner, runsDir, repoRoot);
}

/**
 * Execute a single task
 */
async function executeTask(
  task: QueueTask,
  scanner: QueueScanner,
  runsDir: string,
  repoRoot: string
): Promise<void> {
  const logger = new RunLogger(runsDir, task.id);

  try {
    console.log(
      `[Agent Runner] Executing task ${task.id}: ${task.action} for ${task.target}`
    );

    // Mark task as in-progress
    await scanner.updateTaskStatus(task.id, "in-progress");

    // Create run log
    await logger.createRun({
      action: task.action,
      target: task.target,
      initiator: task.initiator,
    });

    await logger.appendLog(`Starting execution: ${task.action} for ${task.target}`);

    await withBaseShopWriterLock(repoRoot, `business-os:agent-runner:${task.id}`, async () => {
      // Execute skill via Claude CLI
      const prompt = `/${task.action} ${task.target}`;
      const result = await runClaudeCli({
        prompt,
        cwd: repoRoot,
        permissionMode: "bypassPermissions", // Agent runs with full permissions
        timeoutMs: 300000, // 5 minute timeout per task
      });

      await logger.appendLog(
        `Execution completed. Exit code: ${result.exitCode}`
      );

      if (result.exitCode !== 0) {
        // Execution failed
        await logger.appendLog(`Error output:\n${result.stderr}`);
        await logger.finalizeRun("failed", { error: result.stderr });
        await scanner.updateTaskStatus(task.id, "failed");

        console.error(
          `[Agent Runner] Task ${task.id} failed with exit code ${result.exitCode}`
        );
        return;
      }

      // Execution succeeded
      await logger.appendLog(`Standard output:\n${result.stdout}`);

      // Commit outputs to git
      const gitAuthor = userToCommitIdentity(AGENT_USER);

      try {
        // Import simple-git dynamically to avoid top-level async
        const simpleGit = (await import("simple-git")).default;
        const git = simpleGit(repoRoot);

        const status = await git.status();
        if (status.current !== "dev") {
          await logger.appendLog(
            `Refusing to commit: expected branch 'dev' but on '${status.current || "unknown"}'`
          );
          await logger.finalizeRun("failed", {
            error: `Wrong branch: ${status.current || "unknown"}`,
          });
          await scanner.updateTaskStatus(task.id, "failed");
          return;
        }

        if (status.files.length > 0) {
          // There are changes - commit them
          await git.add("."); // Add all changes in repo root

          const commitMessage = `agent: ${task.action} for ${task.target}\n\nTask ID: ${task.id}\nInitiated by: ${task.initiator}`;

          const commitResult = await git.commit(commitMessage, undefined, {
            "--author": `${gitAuthor.name} <${gitAuthor.email}>`,
          });

          const commitHash = commitResult.commit;

          await logger.appendLog(`Changes committed: ${commitHash}`);
          await logger.finalizeRun("complete", {
            output: result.stdout,
            commitHash,
          });

          console.log(
            `[Agent Runner] Task ${task.id} completed successfully. Commit: ${commitHash}`
          );

          // Create progress comment if enabled (MVP-F2)
          await createProgressComment(
            repoRoot,
            commitMessage,
            commitHash,
            task.action
          );
        } else {
          // No changes to commit
          await logger.appendLog(
            "No changes to commit (task may have been read-only)"
          );
          await logger.finalizeRun("complete", { output: result.stdout });

          console.log(`[Agent Runner] Task ${task.id} completed (no changes)`);
        }
      } catch (error) {
        await logger.appendLog(`Git commit failed: ${String(error)}`);
        await logger.finalizeRun("failed", { error: String(error) });
        await scanner.updateTaskStatus(task.id, "failed");

        console.error(
          `[Agent Runner] Task ${task.id} failed during git commit:`,
          error
        );
        return;
      }

      // Mark task as complete
      await scanner.updateTaskStatus(task.id, "complete");
    });

  } catch (error) {
    // Unexpected error during task execution
    console.error(`[Agent Runner] Unexpected error executing task ${task.id}:`, error);

    try {
      await logger.appendLog(`Fatal error: ${String(error)}`);
      await logger.finalizeRun("failed", { error: String(error) });
      await scanner.updateTaskStatus(task.id, "failed");
    } catch (logError) {
      console.error(`[Agent Runner] Failed to log error:`, logError);
    }
  }
}

// Start daemon if run directly
if (require.main === module) {
  runDaemon().catch((error) => {
    console.error("[Agent Runner] Fatal error:", error);
    process.exit(1);
  });
}

export { runDaemon };
