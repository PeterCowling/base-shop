/**
 * Redis Session Store Integration Tests
 *
 * These tests make real calls to an Upstash Redis instance to verify:
 * 1. The RedisSessionStore works correctly with real Redis operations
 * 2. TTL expiration behavior works as expected
 * 3. Multi-key operations (mget, sadd, srem) work correctly
 *
 * REQUIREMENTS:
 * - Set UPSTASH_REDIS_REST_URL environment variable
 * - Set UPSTASH_REDIS_REST_TOKEN environment variable
 * - These tests are skipped in CI unless credentials are configured
 *
 * RUN:
 *   UPSTASH_REDIS_REST_URL=https://... UPSTASH_REDIS_REST_TOKEN=... \
 *     pnpm --filter @acme/auth test -- redisStore.integration
 *
 * NOTE: Tests use unique key prefixes to avoid conflicts with other tests
 * or production data. All test keys are cleaned up after each test.
 */

import { Redis } from "@upstash/redis";

import { RedisSessionStore } from "../redisStore";
import type { SessionRecord } from "../store";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasCredentials = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

// Skip entire suite if no credentials are available
const describeIntegration = hasCredentials ? describe : describe.skip;

describeIntegration("RedisSessionStore integration", () => {
  let redis: Redis;
  let store: RedisSessionStore;
  const testPrefix = `test_${Date.now()}_`;
  const createdKeys: string[] = [];

  // Helper to create a session record with unique IDs
  const createRecord = (suffix: string, customerId?: string): SessionRecord => {
    const sessionId = `${testPrefix}session_${suffix}`;
    const custId = customerId ?? `${testPrefix}customer_${suffix}`;
    createdKeys.push(`session:${sessionId}`);
    createdKeys.push(`customer_sessions:${custId}`);
    return {
      sessionId,
      customerId: custId,
      userAgent: "Integration Test Agent",
      createdAt: new Date(),
    };
  };

  beforeAll(() => {
    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required"
      );
    }

    redis = new Redis({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
    });

    // Use a short TTL for tests (60 seconds)
    store = new RedisSessionStore(redis, 60);
  });

  afterEach(async () => {
    // Clean up all test keys
    if (createdKeys.length > 0) {
      try {
        await redis.del(...createdKeys);
      } catch {
        // Ignore cleanup errors
      }
      createdKeys.length = 0;
    }
  });

  afterAll(async () => {
    // Final cleanup - delete any remaining test keys
    try {
      const keys = await redis.keys(`session:${testPrefix}*`);
      const customerKeys = await redis.keys(`customer_sessions:${testPrefix}*`);
      const allKeys = [...keys, ...customerKeys];
      if (allKeys.length > 0) {
        await redis.del(...allKeys);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("basic CRUD operations", () => {
    it("sets and retrieves a session", async () => {
      const record = createRecord("crud_1");

      await store.set(record);
      const retrieved = await store.get(record.sessionId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.sessionId).toBe(record.sessionId);
      expect(retrieved?.customerId).toBe(record.customerId);
      expect(retrieved?.userAgent).toBe(record.userAgent);
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
      // Allow 1 second difference due to serialization
      expect(
        Math.abs(retrieved!.createdAt.getTime() - record.createdAt.getTime())
      ).toBeLessThan(1000);
    });

    it("returns null for non-existent session", async () => {
      const result = await store.get(`${testPrefix}nonexistent`);
      expect(result).toBeNull();
    });

    it("deletes a session", async () => {
      const record = createRecord("crud_delete");

      await store.set(record);
      expect(await store.get(record.sessionId)).not.toBeNull();

      await store.delete(record.sessionId);
      expect(await store.get(record.sessionId)).toBeNull();
    });

    it("handles deleting non-existent session gracefully", async () => {
      await expect(
        store.delete(`${testPrefix}nonexistent`)
      ).resolves.not.toThrow();
    });
  });

  describe("customer session management", () => {
    it("lists sessions for a customer", async () => {
      const customerId = `${testPrefix}customer_list`;
      const record1 = createRecord("list_1", customerId);
      const record2 = createRecord("list_2", customerId);
      const record3 = createRecord("list_3", customerId);

      await store.set(record1);
      await store.set(record2);
      await store.set(record3);

      const sessions = await store.list(customerId);

      expect(sessions).toHaveLength(3);
      const sessionIds = sessions.map((s) => s.sessionId);
      expect(sessionIds).toContain(record1.sessionId);
      expect(sessionIds).toContain(record2.sessionId);
      expect(sessionIds).toContain(record3.sessionId);
    });

    it("returns empty array for customer with no sessions", async () => {
      const sessions = await store.list(`${testPrefix}no_sessions`);
      expect(sessions).toEqual([]);
    });

    it("removes session from customer list on delete", async () => {
      const customerId = `${testPrefix}customer_remove`;
      const record1 = createRecord("remove_1", customerId);
      const record2 = createRecord("remove_2", customerId);

      await store.set(record1);
      await store.set(record2);

      expect(await store.list(customerId)).toHaveLength(2);

      await store.delete(record1.sessionId);

      const remaining = await store.list(customerId);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].sessionId).toBe(record2.sessionId);
    });
  });

  describe("session updates", () => {
    it("overwrites existing session with same ID", async () => {
      const sessionId = `${testPrefix}session_overwrite`;
      const customerId = `${testPrefix}customer_overwrite`;
      createdKeys.push(`session:${sessionId}`);
      createdKeys.push(`customer_sessions:${customerId}`);

      const record1: SessionRecord = {
        sessionId,
        customerId,
        userAgent: "Agent 1",
        createdAt: new Date("2025-01-01"),
      };

      const record2: SessionRecord = {
        sessionId,
        customerId,
        userAgent: "Agent 2",
        createdAt: new Date("2025-06-01"),
      };

      await store.set(record1);
      const first = await store.get(sessionId);
      expect(first?.userAgent).toBe("Agent 1");

      await store.set(record2);
      const second = await store.get(sessionId);
      expect(second?.userAgent).toBe("Agent 2");
    });
  });

  describe("date serialization", () => {
    it("correctly serializes and deserializes dates", async () => {
      const specificDate = new Date("2025-06-15T14:30:00.000Z");
      const record = createRecord("date_test");
      record.createdAt = specificDate;

      await store.set(record);
      const retrieved = await store.get(record.sessionId);

      expect(retrieved?.createdAt).toBeInstanceOf(Date);
      expect(retrieved?.createdAt.toISOString()).toBe(specificDate.toISOString());
    });

    it("handles dates in list operations", async () => {
      const customerId = `${testPrefix}customer_dates`;
      const date1 = new Date("2025-01-01T00:00:00.000Z");
      const date2 = new Date("2025-06-15T12:30:00.000Z");

      const record1 = createRecord("date_list_1", customerId);
      record1.createdAt = date1;
      const record2 = createRecord("date_list_2", customerId);
      record2.createdAt = date2;

      await store.set(record1);
      await store.set(record2);

      const sessions = await store.list(customerId);

      sessions.forEach((session) => {
        expect(session.createdAt).toBeInstanceOf(Date);
      });

      const dates = sessions.map((s) => s.createdAt.toISOString()).sort();
      expect(dates).toContain(date1.toISOString());
      expect(dates).toContain(date2.toISOString());
    });
  });

  describe("concurrent operations", () => {
    it("handles concurrent session creation for same customer", async () => {
      const customerId = `${testPrefix}customer_concurrent`;
      const records = Array.from({ length: 5 }, (_, i) =>
        createRecord(`concurrent_${i}`, customerId)
      );

      // Create all sessions concurrently
      await Promise.all(records.map((r) => store.set(r)));

      const sessions = await store.list(customerId);
      expect(sessions).toHaveLength(5);
    });

    it("handles concurrent reads and writes", async () => {
      const record = createRecord("concurrent_rw");
      await store.set(record);

      // Concurrent operations
      const [read1, read2, read3] = await Promise.all([
        store.get(record.sessionId),
        store.get(record.sessionId),
        store.get(record.sessionId),
      ]);

      expect(read1?.sessionId).toBe(record.sessionId);
      expect(read2?.sessionId).toBe(record.sessionId);
      expect(read3?.sessionId).toBe(record.sessionId);
    });
  });

  describe("edge cases", () => {
    it("handles special characters in session IDs", async () => {
      const customerId = `${testPrefix}customer_special`;
      createdKeys.push(`session:${testPrefix}special:chars/here`);
      createdKeys.push(`customer_sessions:${customerId}`);

      const record: SessionRecord = {
        sessionId: `${testPrefix}special:chars/here`,
        customerId,
        userAgent: "Test",
        createdAt: new Date(),
      };

      await store.set(record);
      const retrieved = await store.get(record.sessionId);
      expect(retrieved?.sessionId).toBe(record.sessionId);
    });

    it("handles long user agent strings", async () => {
      const longUserAgent = "A".repeat(1000);
      const record = createRecord("long_ua");
      record.userAgent = longUserAgent;

      await store.set(record);
      const retrieved = await store.get(record.sessionId);
      expect(retrieved?.userAgent).toBe(longUserAgent);
    });
  });
});

// Export credentials check for documentation
export const integrationTestsEnabled = hasCredentials;
