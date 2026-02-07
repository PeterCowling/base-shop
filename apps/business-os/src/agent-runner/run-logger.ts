/**
 * Run Logger for Agent Runner
 *
 * V2: Run logging atomicity validation - MVP-E3 Pre-Implementation
 * Handles atomic log file writes during agent execution
 */

import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export type RunStatus = "in-progress" | "complete" | "failed";

export interface RunMetadata {
  action: string;
  target: string;
  initiator: string;
}

export interface RunFinalizeOptions {
  output?: string;
  error?: string;
  commitHash?: string;
}

export interface RunStatusInfo {
  taskId: string;
  status: RunStatus;
  action: string;
  target: string;
  started: string;
  completed?: string;
  duration?: number;
  output?: string;
  error?: string;
}

/**
 * Manages run logs for agent tasks
 */
export class RunLogger {
  private runDir: string;
  private logFile: string;
  private startTime?: number;

  constructor(
    private runsDir: string,
    private taskId: string
  ) {
    this.runDir = path.join(runsDir, taskId);
    this.logFile = path.join(this.runDir, "run.log.md");
  }

  /**
   * Create run directory and initialize log file
   */
  async createRun(metadata: RunMetadata): Promise<void> {
    // Create run directory
    await fs.mkdir(this.runDir, { recursive: true });

    // Initialize log file with frontmatter
    this.startTime = Date.now();
    const startedISO = new Date(this.startTime).toISOString();

    const frontmatter = {
      Type: "AgentRunLog",
      TaskID: this.taskId,
      Status: "in-progress",
      Action: metadata.action,
      Target: metadata.target,
      Initiator: metadata.initiator,
      Started: startedISO,
    };

    const initialContent = `# Agent Run: ${this.taskId}\n\nAction: ${metadata.action}\nTarget: ${metadata.target}\n\n## Log\n\n`;
    const logContent = matter.stringify(initialContent, frontmatter);

    await fs.writeFile(this.logFile, logContent, "utf-8");
  }

  /**
   * Append message to log file
   *
   * Uses append mode for atomicity during concurrent writes
   */
  async appendLog(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    try {
      // Append to log file (atomic operation)
      await fs.appendFile(this.logFile, logEntry, "utf-8");
    } catch (error) {
      // If log file doesn't exist, recreate it with this message
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // Recreate log file
        await fs.mkdir(this.runDir, { recursive: true });
        await fs.writeFile(this.logFile, `## Log\n\n${logEntry}`, "utf-8");
      } else {
        throw error;
      }
    }
  }

  /**
   * Finalize run and update status
   *
   * @param status - Final status (complete or failed)
   * @param options - Finalization options (output, error, commitHash)
   */
  async finalizeRun(
    status: "complete" | "failed",
    options: RunFinalizeOptions
  ): Promise<void> {
    // Read current log file
    const logContent = await fs.readFile(this.logFile, "utf-8");
    const parsed = matter(logContent);

    // Calculate duration
    const completedTime = Date.now();
    const startedTime = new Date(parsed.data.Started as string).getTime();
    const duration = completedTime - startedTime;

    // Update frontmatter
    parsed.data.Status = status;
    parsed.data.Completed = new Date(completedTime).toISOString();
    parsed.data.Duration = duration;

    if (options.output) {
      parsed.data.Output = options.output;
    }

    if (options.error) {
      parsed.data.Error = options.error;
    }

    if (options.commitHash) {
      parsed.data.CommitHash = options.commitHash;
    }

    // Write back to file
    const updated = matter.stringify(parsed.content, parsed.data);
    await fs.writeFile(this.logFile, updated, "utf-8");
  }

  /**
   * Get current run status
   *
   * @returns Run status info or null if run doesn't exist
   */
  async getRunStatus(): Promise<RunStatusInfo | null> {
    try {
      const logContent = await fs.readFile(this.logFile, "utf-8");
      const parsed = matter(logContent);

      return {
        taskId: parsed.data.TaskID as string,
        status: parsed.data.Status as RunStatus,
        action: parsed.data.Action as string,
        target: parsed.data.Target as string,
        started: parsed.data.Started as string,
        completed: parsed.data.Completed as string | undefined,
        duration: parsed.data.Duration as number | undefined,
        output: parsed.data.Output as string | undefined,
        error: parsed.data.Error as string | undefined,
      };
    } catch {
      return null;
    }
  }
}
