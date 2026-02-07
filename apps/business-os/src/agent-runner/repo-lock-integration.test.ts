import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { RepoLock } from "../lib/repo/RepoLock";

/**
 * V3: RepoLock integration validation
 * MVP-E3 Pre-Implementation Validation
 *
 * Proves daemon can acquire/release locks correctly
 * and serialize with RepoWriter operations
 */

describe("RepoLock Integration (Daemon + RepoWriter)", () => {
  let tempDir: string;
  let repoRoot: string;
  let lockDir: string;
  let lock: RepoLock;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo-lock-integration-"));
    repoRoot = path.join(tempDir, "repo");
    lockDir = path.join(repoRoot, "docs/business-os/.locks");

    // Create directories
    await fs.mkdir(lockDir, { recursive: true });

    lock = new RepoLock(lockDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("daemon lock acquisition", () => {
    it("daemon can acquire and release lock", async () => {
      // Simulate daemon acquiring lock
      const result = await lock.acquire({
        userId: "agent-runner",
        action: "execute-skill",
      });

      expect(result.success).toBe(true);
      expect(result.lockId).toBeDefined();

      // Release lock
      await lock.release(result.lockId!);

      // Verify lock released
      const lockFile = path.join(lockDir, "repo.lock");
      const exists = await fs
        .access(lockFile)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    });

    it("daemon respects lock held by RepoWriter", async () => {
      // RepoWriter acquires lock first
      const repoWriterResult = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });
      expect(repoWriterResult.success).toBe(true);

      // Daemon tries to acquire lock (should fail)
      const daemonResult = await lock.acquire({
        userId: "agent-runner",
        action: "execute-skill",
      });
      expect(daemonResult.success).toBe(false);
      expect(daemonResult.errorKey).toBe("businessOs.repoLock.errors.lockHeld");

      // Release RepoWriter lock
      await lock.release(repoWriterResult.lockId!);

      // Daemon can now acquire lock
      const daemonRetry = await lock.acquire({
        userId: "agent-runner",
        action: "execute-skill",
      });
      expect(daemonRetry.success).toBe(true);

      await lock.release(daemonRetry.lockId!);
    });

    it("RepoWriter respects lock held by daemon", async () => {
      // Daemon acquires lock first
      const daemonResult = await lock.acquire({
        userId: "agent-runner",
        action: "execute-skill",
      });
      expect(daemonResult.success).toBe(true);

      // RepoWriter tries to acquire lock (should fail)
      const writerResult = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });
      expect(writerResult.success).toBe(false);

      // Release daemon lock
      await lock.release(daemonResult.lockId!);

      // RepoWriter can now acquire lock
      const writerRetry = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });
      expect(writerRetry.success).toBe(true);

      await lock.release(writerRetry.lockId!);
    });
  });

  describe("concurrent operations", () => {
    it("serializes multiple concurrent lock acquisition attempts", async () => {
      const operations = [
        { userId: "agent-runner", action: "execute-skill" },
        { userId: "pete", action: "write-card" },
        { userId: "sam", action: "update-idea" },
      ];

      // Try to acquire lock concurrently
      const results = await Promise.all(
        operations.map((op) => lock.acquire(op))
      );

      // Only one should succeed
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(2);

      // All failures should be lock-related errors (either lockHeld or acquireFailed due to race)
      for (const result of failed) {
        expect(
          result.errorKey === "businessOs.repoLock.errors.lockHeld" ||
            result.errorKey === "businessOs.repoLock.errors.acquireFailed"
        ).toBe(true);
      }

      // Release the successful lock
      const successfulLock = successful[0];
      if (successfulLock?.lockId) {
        await lock.release(successfulLock.lockId);
      }
    });

    it("handles rapid acquire-release cycles", async () => {
      const cycles = 10;
      const operations = Array.from({ length: cycles }, (_, i) => ({
        userId: `user-${i}`,
        action: "test-action",
      }));

      // Run cycles sequentially (acquire → release → acquire → release)
      for (const op of operations) {
        const result = await lock.acquire(op);
        expect(result.success).toBe(true);
        await lock.release(result.lockId!);
      }

      // Lock should be free after all cycles
      const finalResult = await lock.acquire({
        userId: "final-user",
        action: "final-action",
      });
      expect(finalResult.success).toBe(true);
      await lock.release(finalResult.lockId!);
    });
  });

  describe("lock timeout handling", () => {
    it("recovers stale lock after TTL exceeds with dead process", async () => {
      // Create lock with short TTL for testing
      const shortTtlLock = new RepoLock(lockDir, { ttlMs: 100 });

      // Create stale lock with fake pid
      const staleLockData = {
        userId: "stale-daemon",
        action: "stale-operation",
        pid: 999999, // Non-existent process
        timestamp: Date.now() - 200, // 200ms ago, exceeds 100ms TTL
        lockId: "stale-lock-id",
      };

      const lockFile = path.join(lockDir, "repo.lock");
      await fs.writeFile(lockFile, JSON.stringify(staleLockData, null, 2));

      // Daemon should be able to force-acquire stale lock
      const result = await shortTtlLock.acquire({
        userId: "new-daemon",
        action: "new-operation",
      });

      expect(result.success).toBe(true);
      expect(result.lockId).not.toBe("stale-lock-id");

      await shortTtlLock.release(result.lockId!);
    });

    it("respects fresh lock from alive process", async () => {
      // Create lock with long TTL
      const longTtlLock = new RepoLock(lockDir, { ttlMs: 30000 });

      // Create fresh lock with current process
      const freshLockData = {
        userId: "daemon",
        action: "long-operation",
        pid: process.pid, // Current process (alive)
        timestamp: Date.now(),
        lockId: "fresh-lock-id",
      };

      const lockFile = path.join(lockDir, "repo.lock");
      await fs.writeFile(lockFile, JSON.stringify(freshLockData, null, 2));

      // Should NOT be able to acquire (process is alive)
      const result = await longTtlLock.acquire({
        userId: "new-daemon",
        action: "new-operation",
      });

      expect(result.success).toBe(false);

      // Cleanup
      await fs.rm(lockFile);
    });
  });

  describe("withLock helper for daemon operations", () => {
    it("daemon operation executes under lock and releases automatically", async () => {
      let operationExecuted = false;

      await lock.withLock(
        { userId: "agent-runner", action: "execute-skill" },
        async () => {
          operationExecuted = true;
          // Simulate some work
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      );

      expect(operationExecuted).toBe(true);

      // Verify lock released
      const lockFile = path.join(lockDir, "repo.lock");
      const exists = await fs
        .access(lockFile)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    });

    it("releases lock even if daemon operation throws", async () => {
      const operation = async () => {
        throw new Error("Daemon operation failed");
      };

      await expect(
        lock.withLock(
          { userId: "agent-runner", action: "execute-skill" },
          operation
        )
      ).rejects.toThrow("Daemon operation failed");

      // Verify lock released despite error
      const lockFile = path.join(lockDir, "repo.lock");
      const exists = await fs
        .access(lockFile)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    });

    it("withLock serializes operations when called sequentially", async () => {
      const executionOrder: string[] = [];

      // Execute daemon operation
      await lock.withLock(
        { userId: "agent-runner", action: "daemon-op" },
        async () => {
          executionOrder.push("daemon-start");
          await new Promise((resolve) => setTimeout(resolve, 10));
          executionOrder.push("daemon-end");
        }
      );

      // Execute RepoWriter operation after daemon completes
      await lock.withLock(
        { userId: "pete", action: "writer-op" },
        async () => {
          executionOrder.push("writer-start");
          await new Promise((resolve) => setTimeout(resolve, 10));
          executionOrder.push("writer-end");
        }
      );

      // Verify operations executed in order
      expect(executionOrder).toEqual([
        "daemon-start",
        "daemon-end",
        "writer-start",
        "writer-end",
      ]);
    });

    it("withLock throws when lock is held (fail-fast semantics)", async () => {
      // Daemon acquires lock manually
      const daemonLock = await lock.acquire({
        userId: "agent-runner",
        action: "daemon-op",
      });
      expect(daemonLock.success).toBe(true);

      // RepoWriter tries to use withLock while daemon holds lock
      await expect(
        lock.withLock({ userId: "pete", action: "writer-op" }, async () => {
          // Should not execute
        })
      ).rejects.toThrow();

      // Release daemon lock
      await lock.release(daemonLock.lockId!);
    });
  });
});
