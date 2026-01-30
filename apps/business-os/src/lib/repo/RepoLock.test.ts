/**
 * Tests for RepoLock
 * MVP-C1: Global repo write lock
 */

import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { RepoLock } from "./RepoLock";

describe("RepoLock", () => {
  let testLockDir: string;
  let lock: RepoLock;

  beforeEach(async () => {
    // Create temporary lock directory
    testLockDir = path.join(tmpdir(), `repo-lock-test-${Date.now()}`);
    await fs.mkdir(testLockDir, { recursive: true });

    lock = new RepoLock(testLockDir);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testLockDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("acquire", () => {
    it("should acquire lock successfully when lock is available", async () => {
      const result = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });

      expect(result.success).toBe(true);
      expect(result.lockId).toBeDefined();
      expect(result.errorKey).toBeUndefined();

      // Verify lock file exists
      const lockFile = path.join(testLockDir, "repo.lock");
      await expect(fs.access(lockFile)).resolves.not.toThrow();

      // Verify lock data
      const content = await fs.readFile(lockFile, "utf-8");
      const lockData = JSON.parse(content);
      expect(lockData.userId).toBe("pete");
      expect(lockData.action).toBe("write-card");
      expect(lockData.pid).toBe(process.pid);
      expect(lockData.lockId).toBe(result.lockId);
    });

    it("should fail to acquire lock when lock is already held", async () => {
      // First acquisition should succeed
      const result1 = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });
      expect(result1.success).toBe(true);

      // Second acquisition should fail
      const result2 = await lock.acquire({
        userId: "cristiana",
        action: "write-idea",
      });

      expect(result2.success).toBe(false);
      expect(result2.errorKey).toBe("businessOs.repoLock.errors.lockHeld");
      expect(result2.lockId).toBeUndefined();
    });

    it("should recover stale lock (TTL exceeded, process dead)", async () => {
      // Create lock with short TTL
      const shortTtlLock = new RepoLock(testLockDir, { ttlMs: 100 });

      // Create a fake stale lock (dead process)
      const lockFile = path.join(testLockDir, "repo.lock");
      const staleLockData = {
        userId: "old-user",
        action: "old-action",
        pid: 99999, // Non-existent PID
        timestamp: Date.now() - 200, // 200ms ago (exceeds 100ms TTL)
        lockId: "stale-lock-id",
      };

      await fs.mkdir(testLockDir, { recursive: true });
      await fs.writeFile(lockFile, JSON.stringify(staleLockData, null, 2));

      // Should acquire lock successfully (stale lock recovered)
      const result = await shortTtlLock.acquire({
        userId: "pete",
        action: "new-action",
      });

      expect(result.success).toBe(true);
      expect(result.lockId).toBeDefined();
      expect(result.lockId).not.toBe("stale-lock-id");

      // Verify new lock data
      const content = await fs.readFile(lockFile, "utf-8");
      const lockData = JSON.parse(content);
      expect(lockData.userId).toBe("pete");
      expect(lockData.action).toBe("new-action");
    });

    it("should not recover lock if TTL not exceeded", async () => {
      // Create lock with long TTL
      const longTtlLock = new RepoLock(testLockDir, { ttlMs: 30000 });

      // Create a recent lock
      const lockFile = path.join(testLockDir, "repo.lock");
      const recentLockData = {
        userId: "pete",
        action: "recent-action",
        pid: process.pid, // Current process
        timestamp: Date.now() - 1000, // 1s ago
        lockId: "recent-lock-id",
      };

      await fs.mkdir(testLockDir, { recursive: true });
      await fs.writeFile(lockFile, JSON.stringify(recentLockData, null, 2));

      // Should fail to acquire (lock is fresh)
      const result = await longTtlLock.acquire({
        userId: "cristiana",
        action: "new-action",
      });

      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("businessOs.repoLock.errors.lockHeld");
    });

    it("should recover corrupt lock file", async () => {
      // Create corrupt lock file
      const lockFile = path.join(testLockDir, "repo.lock");
      await fs.mkdir(testLockDir, { recursive: true });
      await fs.writeFile(lockFile, "not valid json!");

      // Should acquire lock successfully (corrupt lock treated as stale)
      const result = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });

      expect(result.success).toBe(true);
      expect(result.lockId).toBeDefined();
    });
  });

  describe("release", () => {
    it("should release lock successfully", async () => {
      const result = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });
      expect(result.success).toBe(true);

      // Release lock
      await lock.release(result.lockId!);

      // Verify lock file is gone
      const lockFile = path.join(testLockDir, "repo.lock");
      await expect(fs.access(lockFile)).rejects.toThrow();
    });

    it("should be idempotent when lock already released", async () => {
      const result = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });
      expect(result.success).toBe(true);

      // Release lock twice
      await lock.release(result.lockId!);
      await expect(lock.release(result.lockId!)).resolves.not.toThrow();
    });

    it("should not release lock with wrong lockId", async () => {
      const result = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });
      expect(result.success).toBe(true);

      // Try to release with wrong ID
      await lock.release("wrong-lock-id");

      // Verify lock still exists
      const lockFile = path.join(testLockDir, "repo.lock");
      await expect(fs.access(lockFile)).resolves.not.toThrow();

      // Clean up
      await lock.release(result.lockId!);
    });
  });

  describe("withLock", () => {
    it("should execute action under lock", async () => {
      let actionExecuted = false;

      await lock.withLock(
        { userId: "pete", action: "write-card" },
        async () => {
          actionExecuted = true;

          // Verify lock is held during action
          const lockFile = path.join(testLockDir, "repo.lock");
          await expect(fs.access(lockFile)).resolves.not.toThrow();
        }
      );

      expect(actionExecuted).toBe(true);

      // Verify lock is released after action
      const lockFile = path.join(testLockDir, "repo.lock");
      await expect(fs.access(lockFile)).rejects.toThrow();
    });

    it("should release lock even if action throws", async () => {
      const testError = new Error("Test error");

      await expect(
        lock.withLock({ userId: "pete", action: "write-card" }, async () => {
          throw testError;
        })
      ).rejects.toThrow("Test error");

      // Verify lock is released after error
      const lockFile = path.join(testLockDir, "repo.lock");
      await expect(fs.access(lockFile)).rejects.toThrow();
    });

    it("should return action result", async () => {
      const result = await lock.withLock(
        { userId: "pete", action: "write-card" },
        async () => {
          return { success: true, data: "test" };
        }
      );

      expect(result).toEqual({ success: true, data: "test" });
    });

    it("should throw if lock cannot be acquired", async () => {
      // Hold lock
      const result1 = await lock.acquire({
        userId: "pete",
        action: "write-card",
      });
      expect(result1.success).toBe(true);

      // Try to execute action with lock held
      await expect(
        lock.withLock(
          { userId: "cristiana", action: "write-idea" },
          async () => {
            return "should not execute";
          }
        )
      ).rejects.toThrow("Repository lock is currently held by another operation");

      // Clean up
      await lock.release(result1.lockId!);
    });
  });

  describe("concurrent lock attempts", () => {
    it("should serialize concurrent write operations with manual retry", async () => {
      const operations: string[] = [];
      const concurrentOps = 5;

      // Helper to retry operation with exponential backoff
      async function retryWithLock(opId: number, maxRetries = 10): Promise<void> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            await lock.withLock(
              { userId: "pete", action: `op-${opId}` },
              async () => {
                operations.push(`start-${opId}`);
                // Simulate work
                await new Promise((resolve) => setTimeout(resolve, 5));
                operations.push(`end-${opId}`);
              }
            );
            return; // Success
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes("Repository lock is currently held")
            ) {
              // Wait with exponential backoff (cap at 50ms)
              const backoffMs = Math.min(Math.pow(2, attempt) * 5, 50);
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
              continue;
            }
            throw error; // Unexpected error
          }
        }
        throw new Error(`Failed to acquire lock after ${maxRetries} retries`);
      }

      // Simulate concurrent operations with retry
      const promises = Array.from({ length: concurrentOps }, (_, i) =>
        retryWithLock(i)
      );

      await Promise.all(promises);

      // Verify all operations completed
      expect(operations).toHaveLength(concurrentOps * 2);

      // Verify operations were serialized (each start is followed by its end)
      for (let i = 0; i < operations.length; i += 2) {
        const start = operations[i];
        const end = operations[i + 1];

        expect(start).toMatch(/^start-\d+$/);
        expect(end).toMatch(/^end-\d+$/);

        const opId = start.replace("start-", "");
        expect(end).toBe(`end-${opId}`);
      }
    });

    it("should fail concurrent operations without retry", async () => {
      const concurrentOps = 3;
      let successCount = 0;
      let failureCount = 0;

      // Simulate concurrent operations without retry
      const promises = Array.from({ length: concurrentOps }, (_, i) =>
        lock
          .withLock({ userId: "pete", action: `op-${i}` }, async () => {
            successCount++;
            // Simulate work
            await new Promise((resolve) => setTimeout(resolve, 20));
          })
          .catch((error) => {
            if (
              error instanceof Error &&
              error.message.includes("Repository lock is currently held")
            ) {
              failureCount++;
            } else {
              throw error; // Unexpected error
            }
          })
      );

      await Promise.all(promises);

      // Exactly one should succeed (the first to acquire lock)
      // Others should fail with lock held error
      expect(successCount).toBe(1);
      expect(failureCount).toBe(concurrentOps - 1);
    });
  });
});
