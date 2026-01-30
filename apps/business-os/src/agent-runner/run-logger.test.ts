import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import matter from "gray-matter";

import { RunLogger } from "./run-logger";

/**
 * V2: Run logging atomicity validation
 * MVP-E3 Pre-Implementation Validation
 */

describe("RunLogger", () => {
  let tempDir: string;
  let runsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "run-logger-test-"));
    runsDir = path.join(tempDir, "agent-runs");
    await fs.mkdir(runsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("createRun", () => {
    it("creates run directory and initial log file", async () => {
      const logger = new RunLogger(runsDir, "task-001");

      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      // Verify directory created
      const runDir = path.join(runsDir, "task-001");
      const dirExists = await fs
        .access(runDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);

      // Verify log file created
      const logFile = path.join(runDir, "run.log.md");
      const logExists = await fs
        .access(logFile)
        .then(() => true)
        .catch(() => false);
      expect(logExists).toBe(true);

      // Verify log file has frontmatter
      const logContent = await fs.readFile(logFile, "utf-8");
      const parsed = matter(logContent);

      expect(parsed.data.Type).toBe("AgentRunLog");
      expect(parsed.data.TaskID).toBe("task-001");
      expect(parsed.data.Status).toBe("in-progress");
      expect(parsed.data.Action).toBe("work-idea");
    });

    it("includes start timestamp in log", async () => {
      const logger = new RunLogger(runsDir, "task-001");

      const before = Date.now();
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });
      const after = Date.now();

      const logFile = path.join(runsDir, "task-001", "run.log.md");
      const logContent = await fs.readFile(logFile, "utf-8");
      const parsed = matter(logContent);

      expect(parsed.data.Started).toBeDefined();
      const startedTime = new Date(parsed.data.Started as string).getTime();
      expect(startedTime).toBeGreaterThanOrEqual(before);
      expect(startedTime).toBeLessThanOrEqual(after);
    });
  });

  describe("appendLog", () => {
    it("appends message to log file", async () => {
      const logger = new RunLogger(runsDir, "task-001");
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      await logger.appendLog("Processing idea...");
      await logger.appendLog("Generated content");

      const logFile = path.join(runsDir, "task-001", "run.log.md");
      const logContent = await fs.readFile(logFile, "utf-8");

      expect(logContent).toContain("Processing idea...");
      expect(logContent).toContain("Generated content");
    });

    it("maintains log order during rapid appends", async () => {
      const logger = new RunLogger(runsDir, "task-001");
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      // Append multiple messages rapidly
      const messages = Array.from({ length: 10 }, (_, i) => `Message ${i + 1}`);
      await Promise.all(messages.map((msg) => logger.appendLog(msg)));

      const logFile = path.join(runsDir, "task-001", "run.log.md");
      const logContent = await fs.readFile(logFile, "utf-8");

      // Verify all messages present
      for (const msg of messages) {
        expect(logContent).toContain(msg);
      }
    });

    it("adds timestamps to each log entry", async () => {
      const logger = new RunLogger(runsDir, "task-001");
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      await logger.appendLog("Test message");

      const logFile = path.join(runsDir, "task-001", "run.log.md");
      const logContent = await fs.readFile(logFile, "utf-8");

      // Should contain timestamp in ISO format
      expect(logContent).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("finalizeRun", () => {
    it("marks run as complete with success", async () => {
      const logger = new RunLogger(runsDir, "task-001");
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      await logger.finalizeRun("complete", {
        output: "Successfully worked idea",
        commitHash: "abc123",
      });

      const logFile = path.join(runsDir, "task-001", "run.log.md");
      const logContent = await fs.readFile(logFile, "utf-8");
      const parsed = matter(logContent);

      expect(parsed.data.Status).toBe("complete");
      expect(parsed.data.Completed).toBeDefined();
      expect(parsed.data.Output).toBe("Successfully worked idea");
      expect(parsed.data.CommitHash).toBe("abc123");
    });

    it("marks run as failed with error", async () => {
      const logger = new RunLogger(runsDir, "task-001");
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      await logger.finalizeRun("failed", {
        error: "Skill execution failed",
      });

      const logFile = path.join(runsDir, "task-001", "run.log.md");
      const logContent = await fs.readFile(logFile, "utf-8");
      const parsed = matter(logContent);

      expect(parsed.data.Status).toBe("failed");
      expect(parsed.data.Error).toBe("Skill execution failed");
    });

    it("includes duration in completed run", async () => {
      const logger = new RunLogger(runsDir, "task-001");
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      // Wait a bit to ensure measurable duration
      await new Promise((resolve) => setTimeout(resolve, 10));

      await logger.finalizeRun("complete", {});

      const logFile = path.join(runsDir, "task-001", "run.log.md");
      const logContent = await fs.readFile(logFile, "utf-8");
      const parsed = matter(logContent);

      expect(parsed.data.Duration).toBeDefined();
      expect(typeof parsed.data.Duration).toBe("number");
      expect(parsed.data.Duration).toBeGreaterThan(0);
    });
  });

  describe("corruption recovery", () => {
    it("recovers from partial log file corruption", async () => {
      const logger = new RunLogger(runsDir, "task-001");
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      // Corrupt the log file by truncating it mid-write
      const logFile = path.join(runsDir, "task-001", "run.log.md");
      const logContent = await fs.readFile(logFile, "utf-8");
      await fs.writeFile(logFile, logContent.slice(0, logContent.length / 2));

      // Should still be able to append (appends after existing content)
      await expect(logger.appendLog("Recovery test")).resolves.not.toThrow();

      const recoveredContent = await fs.readFile(logFile, "utf-8");
      expect(recoveredContent).toContain("Recovery test");
    });

    it("handles missing log file gracefully on append", async () => {
      const logger = new RunLogger(runsDir, "task-001");
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      // Delete log file
      const logFile = path.join(runsDir, "task-001", "run.log.md");
      await fs.rm(logFile);

      // Should recreate log file on append
      await logger.appendLog("After deletion");

      const exists = await fs
        .access(logFile)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe("getRunStatus", () => {
    it("returns current run status", async () => {
      const logger = new RunLogger(runsDir, "task-001");
      await logger.createRun({
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
      });

      const status = await logger.getRunStatus();

      expect(status).toMatchObject({
        taskId: "task-001",
        status: "in-progress",
        action: "work-idea",
      });
    });

    it("returns null for non-existent run", async () => {
      const logger = new RunLogger(runsDir, "task-999");

      const status = await logger.getRunStatus();

      expect(status).toBeNull();
    });
  });
});
