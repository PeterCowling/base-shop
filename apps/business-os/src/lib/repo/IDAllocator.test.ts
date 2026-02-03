/**
 * Tests for IDAllocator
 * MVP-C2: Collision-proof ID allocation
 */

import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { IDAllocator } from "./IDAllocator";
import { RepoLock } from "./RepoLock";

describe("IDAllocator", () => {
  let testDir: string;
  let testLockDir: string;
  let countersFile: string;
  let lock: RepoLock;
  let allocator: IDAllocator;

  beforeEach(async () => {
    // Create temporary directories
    testDir = path.join(tmpdir(), `id-allocator-test-${Date.now()}`);
    testLockDir = path.join(testDir, ".locks");
    countersFile = path.join(testDir, "counters.json");

    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(testLockDir, { recursive: true });

    lock = new RepoLock(testLockDir);
    allocator = new IDAllocator(countersFile, lock);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("allocate", () => {
    it("should allocate first ID when counters file does not exist", async () => {
      const id = await allocator.allocate("BRIK", "card");

      expect(id).toBe("BRIK-001");

      // Verify counters file was created
      const content = await fs.readFile(countersFile, "utf-8");
      const counters = JSON.parse(content);
      expect(counters.BRIK.card).toBe(1);
    });

    it("should allocate sequential IDs", async () => {
      const id1 = await allocator.allocate("BRIK", "card");
      const id2 = await allocator.allocate("BRIK", "card");
      const id3 = await allocator.allocate("BRIK", "card");

      expect(id1).toBe("BRIK-001");
      expect(id2).toBe("BRIK-002");
      expect(id3).toBe("BRIK-003");
    });

    it("should handle different businesses independently", async () => {
      const brik1 = await allocator.allocate("BRIK", "card");
      const test1 = await allocator.allocate("TEST", "card");
      const brik2 = await allocator.allocate("BRIK", "card");
      const test2 = await allocator.allocate("TEST", "card");

      expect(brik1).toBe("BRIK-001");
      expect(test1).toBe("TEST-001");
      expect(brik2).toBe("BRIK-002");
      expect(test2).toBe("TEST-002");
    });

    it("should handle different types independently", async () => {
      const card1 = await allocator.allocate("BRIK", "card");
      const idea1 = await allocator.allocate("BRIK", "idea");
      const card2 = await allocator.allocate("BRIK", "card");
      const idea2 = await allocator.allocate("BRIK", "idea");

      expect(card1).toBe("BRIK-001");
      expect(idea1).toBe("BRIK-OPP-001");
      expect(card2).toBe("BRIK-002");
      expect(idea2).toBe("BRIK-OPP-002");
    });

    it("should load existing counters from file", async () => {
      // Create initial counters file
      const initialCounters = {
        BRIK: {
          card: 5,
          idea: 3,
        },
      };
      await fs.writeFile(countersFile, JSON.stringify(initialCounters, null, 2));

      const card1 = await allocator.allocate("BRIK", "card");
      const idea1 = await allocator.allocate("BRIK", "idea");

      expect(card1).toBe("BRIK-006");
      expect(idea1).toBe("BRIK-OPP-004");
    });

    it("should handle concurrent allocations without duplicates", async () => {
      const concurrentOps = 10;
      const ids: string[] = [];

      // Helper to retry allocation with exponential backoff
      async function allocateWithRetry(maxRetries = 10): Promise<string> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await allocator.allocate("BRIK", "card");
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
        throw new Error("Failed to allocate after retries");
      }

      // Simulate concurrent ID allocations with retry
      const promises = Array.from({ length: concurrentOps }, () =>
        allocateWithRetry()
      );

      const results = await Promise.all(promises);
      ids.push(...results);

      // Verify all IDs are unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(concurrentOps);

      // Verify IDs are sequential
      const expectedIds = Array.from(
        { length: concurrentOps },
        (_, i) => `BRIK-${String(i + 1).padStart(3, "0")}`
      );
      expect(ids.sort()).toEqual(expectedIds);
    });

    it("should preserve counters across allocator instances", async () => {
      // First allocator
      const id1 = await allocator.allocate("BRIK", "card");
      expect(id1).toBe("BRIK-001");

      // Create new allocator (simulates restart)
      const allocator2 = new IDAllocator(countersFile, lock);
      const id2 = await allocator2.allocate("BRIK", "card");

      expect(id2).toBe("BRIK-002");
    });

    it("should handle very large numbers", async () => {
      // Create counters file with large number
      const initialCounters = {
        BRIK: {
          card: 9998,
        },
      };
      await fs.writeFile(countersFile, JSON.stringify(initialCounters, null, 2));

      const id1 = await allocator.allocate("BRIK", "card");
      const id2 = await allocator.allocate("BRIK", "card");
      const id3 = await allocator.allocate("BRIK", "card");

      expect(id1).toBe("BRIK-9999");
      expect(id2).toBe("BRIK-10000");
      expect(id3).toBe("BRIK-10001");
    });

    it("should throw error if lock cannot be acquired", async () => {
      // Acquire lock manually
      const lockResult = await lock.acquire({
        userId: "test",
        action: "test-lock",
      });
      expect(lockResult.success).toBe(true);

      // Try to allocate (should fail to acquire lock)
      await expect(allocator.allocate("BRIK", "card")).rejects.toThrow(
        "Repository lock is currently held"
      );

      // Clean up
      await lock.release(lockResult.lockId!);
    });
  });

  describe("getCurrentCounter", () => {
    it("should return 0 for non-existent business/type", async () => {
      const counter = await allocator.getCurrentCounter("BRIK", "card");
      expect(counter).toBe(0);
    });

    it("should return current counter value", async () => {
      await allocator.allocate("BRIK", "card");
      await allocator.allocate("BRIK", "card");

      const counter = await allocator.getCurrentCounter("BRIK", "card");
      expect(counter).toBe(2);
    });

    it("should return correct counter for different businesses/types", async () => {
      await allocator.allocate("BRIK", "card");
      await allocator.allocate("BRIK", "card");
      await allocator.allocate("BRIK", "idea");
      await allocator.allocate("TEST", "card");

      expect(await allocator.getCurrentCounter("BRIK", "card")).toBe(2);
      expect(await allocator.getCurrentCounter("BRIK", "idea")).toBe(1);
      expect(await allocator.getCurrentCounter("TEST", "card")).toBe(1);
      expect(await allocator.getCurrentCounter("TEST", "idea")).toBe(0);
    });
  });

  describe("setCounter", () => {
    it("should set counter to specified value", async () => {
      await allocator.setCounter("BRIK", "card", 100);

      const counter = await allocator.getCurrentCounter("BRIK", "card");
      expect(counter).toBe(100);

      const nextId = await allocator.allocate("BRIK", "card");
      expect(nextId).toBe("BRIK-101");
    });

    it("should handle setting multiple counters", async () => {
      await allocator.setCounter("BRIK", "card", 10);
      await allocator.setCounter("BRIK", "idea", 5);
      await allocator.setCounter("TEST", "card", 20);

      expect(await allocator.getCurrentCounter("BRIK", "card")).toBe(10);
      expect(await allocator.getCurrentCounter("BRIK", "idea")).toBe(5);
      expect(await allocator.getCurrentCounter("TEST", "card")).toBe(20);
    });

    it("should allow setting counter backwards (for testing/recovery)", async () => {
      await allocator.allocate("BRIK", "card");
      await allocator.allocate("BRIK", "card");

      expect(await allocator.getCurrentCounter("BRIK", "card")).toBe(2);

      await allocator.setCounter("BRIK", "card", 1);
      expect(await allocator.getCurrentCounter("BRIK", "card")).toBe(1);
    });
  });
});
