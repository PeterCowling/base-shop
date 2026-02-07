/**
 * Queue Scanner for Agent Runner
 *
 * V1: Polling loop validation - MVP-E3 Pre-Implementation
 * Scans agent-queue directory for pending tasks
 */

import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export type TaskStatus = "pending" | "in-progress" | "complete" | "failed";

export interface QueueTask {
  id: string;
  status: TaskStatus;
  action: string;
  target: string;
  initiator: string;
  created: string;
  filePath: string;
  content: string;
}

interface TaskFrontmatter {
  Type: string;
  ID: string;
  Status: TaskStatus;
  Action: string;
  Target: string;
  Initiator: string;
  Created: string;
}

/**
 * Scans agent queue directory for tasks
 */
export class QueueScanner {
  constructor(private queueDir: string) {}

  /**
   * Scan queue directory for tasks
   *
   * @param statusFilter - Optional status filter (e.g., "pending")
   * @returns Array of tasks, sorted by creation time (oldest first)
   */
  async scanQueue(statusFilter?: TaskStatus): Promise<QueueTask[]> {
    try {
      // Check if queue directory exists
      await fs.access(this.queueDir);
    } catch {
      // Queue directory doesn't exist - return empty array
      return [];
    }

    try {
      // Read all files in queue directory
      const files = await fs.readdir(this.queueDir);

      // Filter to markdown files only
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      // Parse each file
      const tasks: QueueTask[] = [];
      for (const file of mdFiles) {
        const filePath = path.join(this.queueDir, file);
        const task = await this.parseTaskFile(filePath);

        if (task) {
          // Apply status filter if provided
          if (!statusFilter || task.status === statusFilter) {
            tasks.push(task);
          }
        }
      }

      // Sort by creation time (oldest first)
      tasks.sort((a, b) => {
        return new Date(a.created).getTime() - new Date(b.created).getTime();
      });

      return tasks;
    } catch {
      // If any error reading directory, return empty array
      return [];
    }
  }

  /**
   * Get specific task by ID
   *
   * @param taskId - Task ID to retrieve
   * @returns Task or null if not found
   */
  async getTask(taskId: string): Promise<QueueTask | null> {
    const filePath = path.join(this.queueDir, `${taskId}.md`);

    try {
      return await this.parseTaskFile(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Update task status
   *
   * @param taskId - Task ID to update
   * @param status - New status
   */
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const filePath = path.join(this.queueDir, `${taskId}.md`);

    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const parsed = matter(fileContent);

      // Update status in frontmatter
      parsed.data.Status = status;

      // Write back to file
      const updated = matter.stringify(parsed.content, parsed.data);
      await fs.writeFile(filePath, updated, "utf-8");
    } catch (error) {
      throw new Error(`Failed to update task status: ${String(error)}`);
    }
  }

  /**
   * Parse task file and validate
   *
   * @param filePath - Path to task file
   * @returns Parsed task or null if invalid
   */
  private async parseTaskFile(filePath: string): Promise<QueueTask | null> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const parsed = matter(fileContent);

      // Validate required fields
      const data = parsed.data as Partial<TaskFrontmatter>;
      if (
        !data.Type ||
        !data.ID ||
        !data.Status ||
        !data.Action ||
        !data.Target ||
        !data.Initiator ||
        !data.Created
      ) {
        // Missing required fields - skip this file
        return null;
      }

      // Validate Type field
      if (data.Type !== "AgentTask") {
        return null;
      }

      return {
        id: data.ID,
        status: data.Status,
        action: data.Action,
        target: data.Target,
        initiator: data.Initiator,
        created: data.Created,
        filePath,
        content: parsed.content,
      };
    } catch {
      // File malformed or unreadable - skip
      return null;
    }
  }
}
