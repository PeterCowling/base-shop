import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { HealthCheck } from "./health-check";

/**
 * V5: Health check implementation validation
 * MVP-E3 Pre-Implementation Validation
 */

describe("HealthCheck", () => {
  let tempDir: string;
  let runsDir: string;
  let healthCheck: HealthCheck;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "health-check-test-"));
    runsDir = path.join(tempDir, "agent-runs");
    await fs.mkdir(runsDir, { recursive: true });
    healthCheck = new HealthCheck(runsDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("recordPoll", () => {
    it("writes health file with healthy status", async () => {
      await healthCheck.recordPoll(2);

      const healthFile = path.join(runsDir, ".health");
      const exists = await fs
        .access(healthFile)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);

      const content = await fs.readFile(healthFile, "utf-8");
      const data = JSON.parse(content);

      expect(data.status).toBe("healthy");
      expect(data.activeTasks).toBe(2);
      expect(data.lastPoll).toBeDefined();
      expect(data.pid).toBe(process.pid);
    });

    it("includes task counts", async () => {
      healthCheck.recordCompletion();
      healthCheck.recordCompletion();
      healthCheck.recordFailure();

      await healthCheck.recordPoll(1);

      const status = await healthCheck.getStatus();

      expect(status?.completedTasks).toBe(2);
      expect(status?.failedTasks).toBe(1);
    });

    it("includes uptime", async () => {
      // Wait to ensure measurable uptime (>1000ms to get ≥1 second)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      await healthCheck.recordPoll(0);

      const status = await healthCheck.getStatus();

      expect(status?.uptime).toBeGreaterThanOrEqual(1);
    });
  });

  describe("recordCompletion", () => {
    it("increments completed count", async () => {
      healthCheck.recordCompletion();
      healthCheck.recordCompletion();
      healthCheck.recordCompletion();

      await healthCheck.recordPoll(0);

      const status = await healthCheck.getStatus();

      expect(status?.completedTasks).toBe(3);
    });
  });

  describe("recordFailure", () => {
    it("increments failed count", async () => {
      healthCheck.recordFailure();
      healthCheck.recordFailure();

      await healthCheck.recordPoll(0);

      const status = await healthCheck.getStatus();

      expect(status?.failedTasks).toBe(2);
    });
  });

  describe("markDegraded", () => {
    it("writes degraded status", async () => {
      await healthCheck.markDegraded("Slow polling");

      const status = await healthCheck.getStatus();

      expect(status?.status).toBe("degraded");
    });

    it("includes reason in file", async () => {
      await healthCheck.markDegraded("Test reason");

      const healthFile = path.join(runsDir, ".health");
      const content = await fs.readFile(healthFile, "utf-8");

      expect(content).toContain("Test reason");
    });
  });

  describe("markUnhealthy", () => {
    it("writes unhealthy status", async () => {
      await healthCheck.markUnhealthy("Critical failure");

      const status = await healthCheck.getStatus();

      expect(status?.status).toBe("unhealthy");
    });
  });

  describe("getStatus", () => {
    it("returns null for missing health file", async () => {
      const status = await healthCheck.getStatus();

      expect(status).toBeNull();
    });

    it("returns parsed health data", async () => {
      await healthCheck.recordPoll(5);

      const status = await healthCheck.getStatus();

      expect(status).not.toBeNull();
      expect(status?.status).toBe("healthy");
      expect(status?.activeTasks).toBe(5);
    });
  });

  describe("checkHealth", () => {
    it("returns unhealthy for missing file", async () => {
      const result = await healthCheck.checkHealth();

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("missing");
    });

    it("returns healthy for recent poll (<30s)", async () => {
      await healthCheck.recordPoll(0);

      const result = await healthCheck.checkHealth();

      expect(result.status).toBe("healthy");
      expect(result.age).toBeLessThan(30);
    });

    it("returns degraded for stale poll (30-60s)", async () => {
      // Write old health file
      const healthFile = path.join(runsDir, ".health");
      const oldData = {
        status: "healthy",
        lastPoll: new Date(Date.now() - 45000).toISOString(), // 45s ago
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        uptime: 100,
        pid: process.pid,
      };

      await fs.writeFile(healthFile, JSON.stringify(oldData, null, 2));

      const result = await healthCheck.checkHealth();

      expect(result.status).toBe("degraded");
      expect(result.age).toBeGreaterThanOrEqual(40);
      expect(result.age).toBeLessThan(60);
    });

    it("returns unhealthy for very stale poll (>60s)", async () => {
      // Write very old health file
      const healthFile = path.join(runsDir, ".health");
      const oldData = {
        status: "healthy",
        lastPoll: new Date(Date.now() - 90000).toISOString(), // 90s ago
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        uptime: 100,
        pid: process.pid,
      };

      await fs.writeFile(healthFile, JSON.stringify(oldData, null, 2));

      const result = await healthCheck.checkHealth();

      expect(result.status).toBe("unhealthy");
      expect(result.age).toBeGreaterThanOrEqual(85);
    });
  });

  describe("atomic writes", () => {
    it("uses temp file for atomic writes", async () => {
      await healthCheck.recordPoll(0);

      // Health file should exist, temp file should not
      const healthFile = path.join(runsDir, ".health");
      const tempFile = `${healthFile}.tmp`;

      const healthExists = await fs
        .access(healthFile)
        .then(() => true)
        .catch(() => false);
      const tempExists = await fs
        .access(tempFile)
        .then(() => true)
        .catch(() => false);

      expect(healthExists).toBe(true);
      expect(tempExists).toBe(false);
    });

    it("handles concurrent writes gracefully", async () => {
      // Write multiple times concurrently
      await Promise.all([
        healthCheck.recordPoll(1),
        healthCheck.recordPoll(2),
        healthCheck.recordPoll(3),
      ]);

      // Health file should be valid JSON (one of the writes succeeded)
      const status = await healthCheck.getStatus();

      expect(status).not.toBeNull();
      expect(status?.status).toBe("healthy");
    });
  });

  describe("error handling", () => {
    it("suppresses write errors gracefully", async () => {
      // Create health check with read-only directory
      const readOnlyDir = path.join(tempDir, "readonly");
      await fs.mkdir(readOnlyDir, { recursive: true });
      await fs.chmod(readOnlyDir, 0o444); // Read-only

      const readOnlyHealthCheck = new HealthCheck(readOnlyDir);

      // Should not throw
      await expect(readOnlyHealthCheck.recordPoll(0)).resolves.not.toThrow();

      // Restore permissions for cleanup
      await fs.chmod(readOnlyDir, 0o755);
    });
  });
});
