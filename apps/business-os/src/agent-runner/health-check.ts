/**
 * Health Check for Agent Runner
 *
 * V5: Health check implementation - MVP-E3 Pre-Implementation
 * Writes daemon status to .health file for monitoring
 */

import fs from "node:fs/promises";
import path from "node:path";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckData {
  status: HealthStatus;
  lastPoll: string; // ISO timestamp
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  uptime: number; // seconds
  pid: number;
}

export interface HealthCheckOptions {
  healthFile?: string; // Custom health file path (default: {runsDir}/.health)
}

/**
 * Manages health check status file for daemon monitoring
 */
export class HealthCheck {
  private healthFile: string;
  private startTime: number;
  private completedCount = 0;
  private failedCount = 0;

  constructor(runsDir: string, options?: HealthCheckOptions) {
    this.healthFile =
      options?.healthFile || path.join(runsDir, ".health");
    this.startTime = Date.now();
  }

  /**
   * Record successful poll
   */
  async recordPoll(activeTasks: number): Promise<void> {
    const data: HealthCheckData = {
      status: "healthy",
      lastPoll: new Date().toISOString(),
      activeTasks,
      completedTasks: this.completedCount,
      failedTasks: this.failedCount,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      pid: process.pid,
    };

    await this.writeHealthFile(data);
  }

  /**
   * Record task completion
   */
  recordCompletion(): void {
    this.completedCount++;
  }

  /**
   * Record task failure
   */
  recordFailure(): void {
    this.failedCount++;
  }

  /**
   * Mark daemon as degraded (e.g., errors but still polling)
   */
  async markDegraded(reason: string): Promise<void> {
    const data: HealthCheckData = {
      status: "degraded",
      lastPoll: new Date().toISOString(),
      activeTasks: 0,
      completedTasks: this.completedCount,
      failedTasks: this.failedCount,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      pid: process.pid,
    };

    await this.writeHealthFile(data, reason);
  }

  /**
   * Mark daemon as unhealthy (critical failure)
   */
  async markUnhealthy(reason: string): Promise<void> {
    const data: HealthCheckData = {
      status: "unhealthy",
      lastPoll: new Date().toISOString(),
      activeTasks: 0,
      completedTasks: this.completedCount,
      failedTasks: this.failedCount,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      pid: process.pid,
    };

    await this.writeHealthFile(data, reason);
  }

  /**
   * Read current health status
   *
   * Returns null if health file doesn't exist
   */
  async getStatus(): Promise<HealthCheckData | null> {
    try {
      const content = await fs.readFile(this.healthFile, "utf-8");
      const data = JSON.parse(content) as HealthCheckData;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Check if daemon is healthy based on last poll time
   *
   * - Healthy: last poll <30s ago
   * - Degraded: last poll 30-60s ago
   * - Unhealthy: last poll >60s ago or file missing
   */
  async checkHealth(): Promise<{
    status: HealthStatus;
    age: number;
    message: string;
  }> {
    const data = await this.getStatus();

    if (!data) {
      return {
        status: "unhealthy",
        age: -1,
        // i18n-exempt -- BOS-33 health check status message (non-UI) [ttl=2026-03-31]
        message: "Health file missing",
      };
    }

    const lastPollTime = new Date(data.lastPoll).getTime();
    const age = Math.floor((Date.now() - lastPollTime) / 1000);

    if (age > 60) {
      return {
        status: "unhealthy",
        age,
        message: `Last poll ${age}s ago (stale)`,
      };
    } else if (age > 30) {
      return {
        status: "degraded",
        age,
        message: `Last poll ${age}s ago (slow)`,
      };
    } else {
      return {
        status: "healthy",
        age,
        message: `Last poll ${age}s ago`,
      };
    }
  }

  /**
   * Write health file atomically
   */
  private async writeHealthFile(
    data: HealthCheckData,
    reason?: string
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.healthFile);
      await fs.mkdir(dir, { recursive: true });

      // Build content (include reason in data if provided)
      const dataWithReason = reason
        ? { ...data, reason }
        : data;
      const content = JSON.stringify(dataWithReason, null, 2);

      // Write atomically (temp file + rename)
      // Use a unique temp file per write to avoid cross-write races.
      const tempFile = `${this.healthFile}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}`;
      await fs.writeFile(tempFile, content, "utf-8");
      await fs.rename(tempFile, this.healthFile);
    } catch (error) {
      // Suppress write errors (don't crash daemon on health check failure)
      if (process.env.NODE_ENV !== "test") {
        console.error("Failed to write health file:", error);
      }
    }
  }
}
