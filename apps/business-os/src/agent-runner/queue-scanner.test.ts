import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { QueueScanner, type QueueTask } from "./queue-scanner";

/**
 * V1: Polling loop validation - Queue scanning tests
 * MVP-E3 Pre-Implementation Validation
 */

describe("QueueScanner", () => {
  let tempDir: string;
  let queueDir: string;
  let scanner: QueueScanner;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "queue-scanner-test-"));
    queueDir = path.join(tempDir, "agent-queue");
    await fs.mkdir(queueDir, { recursive: true });
    scanner = new QueueScanner(queueDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("scanQueue", () => {
    it("returns empty array for empty queue", async () => {
      const tasks = await scanner.scanQueue();

      expect(tasks).toEqual([]);
    });

    it("finds single pending task", async () => {
      // Create a pending task file
      const taskFile = path.join(queueDir, "task-001.md");
      const taskContent = `---
Type: AgentTask
ID: task-001
Status: pending
Action: work-idea
Target: BRIK-OPP-0001
Initiator: pete
Created: 2026-01-30T12:00:00Z
---

# Work Idea: BRIK-OPP-0001

Convert raw idea to worked idea with structured content.
`;
      await fs.writeFile(taskFile, taskContent, "utf-8");

      const tasks = await scanner.scanQueue();

      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        id: "task-001",
        status: "pending",
        action: "work-idea",
        target: "BRIK-OPP-0001",
        initiator: "pete",
        filePath: taskFile,
      });
    });

    it("finds multiple tasks and sorts by creation time", async () => {
      // Create multiple task files with different timestamps
      const task1 = {
        id: "task-001",
        created: "2026-01-30T12:00:00Z",
      };
      const task2 = {
        id: "task-002",
        created: "2026-01-30T11:00:00Z", // Earlier
      };
      const task3 = {
        id: "task-003",
        created: "2026-01-30T13:00:00Z", // Latest
      };

      for (const task of [task1, task2, task3]) {
        const taskFile = path.join(queueDir, `${task.id}.md`);
        const taskContent = `---
Type: AgentTask
ID: ${task.id}
Status: pending
Action: work-idea
Target: TEST-001
Initiator: pete
Created: ${task.created}
---

# Task ${task.id}
`;
        await fs.writeFile(taskFile, taskContent, "utf-8");
      }

      const tasks = await scanner.scanQueue();

      expect(tasks).toHaveLength(3);
      // Should be sorted oldest first
      expect(tasks[0]?.id).toBe("task-002");
      expect(tasks[1]?.id).toBe("task-001");
      expect(tasks[2]?.id).toBe("task-003");
    });

    it("filters by status (pending only)", async () => {
      // Create tasks with different statuses
      const statuses = ["pending", "in-progress", "complete", "failed"];
      for (const status of statuses) {
        const taskFile = path.join(queueDir, `task-${status}.md`);
        const taskContent = `---
Type: AgentTask
ID: task-${status}
Status: ${status}
Action: work-idea
Target: TEST-001
Initiator: pete
Created: 2026-01-30T12:00:00Z
---

# Task ${status}
`;
        await fs.writeFile(taskFile, taskContent, "utf-8");
      }

      const pendingTasks = await scanner.scanQueue("pending");

      expect(pendingTasks).toHaveLength(1);
      expect(pendingTasks[0]?.status).toBe("pending");

      const allTasks = await scanner.scanQueue();
      expect(allTasks).toHaveLength(4);
    });

    it("skips malformed files gracefully", async () => {
      // Create valid task
      const validFile = path.join(queueDir, "task-valid.md");
      await fs.writeFile(
        validFile,
        `---
Type: AgentTask
ID: task-valid
Status: pending
Action: work-idea
Target: TEST-001
Initiator: pete
Created: 2026-01-30T12:00:00Z
---

# Valid task
`,
        "utf-8"
      );

      // Create malformed files
      const malformedYaml = path.join(queueDir, "task-malformed-yaml.md");
      await fs.writeFile(
        malformedYaml,
        `---
Type: AgentTask
ID: task-malformed
Status: pending
[invalid yaml here
---

# Malformed YAML
`,
        "utf-8"
      );

      const missingFrontmatter = path.join(queueDir, "task-no-frontmatter.md");
      await fs.writeFile(
        missingFrontmatter,
        "# No frontmatter at all\nJust content",
        "utf-8"
      );

      const missingFields = path.join(queueDir, "task-missing-fields.md");
      await fs.writeFile(
        missingFields,
        `---
Type: AgentTask
ID: task-incomplete
---

# Missing required fields
`,
        "utf-8"
      );

      const tasks = await scanner.scanQueue();

      // Should only find the valid task
      expect(tasks).toHaveLength(1);
      expect(tasks[0]?.id).toBe("task-valid");
    });

    it("ignores non-markdown files", async () => {
      // Create markdown task
      const mdFile = path.join(queueDir, "task-001.md");
      await fs.writeFile(
        mdFile,
        `---
Type: AgentTask
ID: task-001
Status: pending
Action: work-idea
Target: TEST-001
Initiator: pete
Created: 2026-01-30T12:00:00Z
---

# Valid task
`,
        "utf-8"
      );

      // Create non-markdown files
      await fs.writeFile(path.join(queueDir, "readme.txt"), "Not a task");
      await fs.writeFile(path.join(queueDir, ".gitkeep"), "");
      await fs.writeFile(path.join(queueDir, "config.json"), "{}");

      const tasks = await scanner.scanQueue();

      expect(tasks).toHaveLength(1);
      expect(tasks[0]?.id).toBe("task-001");
    });

    it("handles queue directory not existing", async () => {
      const nonExistentDir = path.join(tempDir, "does-not-exist");
      const scanner2 = new QueueScanner(nonExistentDir);

      const tasks = await scanner2.scanQueue();

      expect(tasks).toEqual([]);
    });
  });

  describe("getTask", () => {
    it("retrieves specific task by ID", async () => {
      const taskFile = path.join(queueDir, "task-001.md");
      await fs.writeFile(
        taskFile,
        `---
Type: AgentTask
ID: task-001
Status: pending
Action: work-idea
Target: BRIK-OPP-0001
Initiator: pete
Created: 2026-01-30T12:00:00Z
---

# Work Idea
`,
        "utf-8"
      );

      const task = await scanner.getTask("task-001");

      expect(task).toBeDefined();
      expect(task?.id).toBe("task-001");
      expect(task?.action).toBe("work-idea");
    });

    it("returns null for non-existent task", async () => {
      const task = await scanner.getTask("does-not-exist");

      expect(task).toBeNull();
    });
  });

  describe("updateTaskStatus", () => {
    it("updates task status field", async () => {
      const taskFile = path.join(queueDir, "task-001.md");
      await fs.writeFile(
        taskFile,
        `---
Type: AgentTask
ID: task-001
Status: pending
Action: work-idea
Target: BRIK-OPP-0001
Initiator: pete
Created: 2026-01-30T12:00:00Z
---

# Work Idea
`,
        "utf-8"
      );

      await scanner.updateTaskStatus("task-001", "in-progress");

      const task = await scanner.getTask("task-001");
      expect(task?.status).toBe("in-progress");
    });
  });
});
