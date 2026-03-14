/**
 * Tests for mapPrimeSummaryToInboxThread behaviour exercised via listPrimeInboxThreadSummaries.
 *
 * mapPrimeSummaryToInboxThread is not exported, so these tests exercise it through the
 * exported listPrimeInboxThreadSummaries() function with a mocked global fetch.
 * This is the established pattern used in send-prime-inbox-thread.test.ts.
 *
 * TC-01: lastSyncedAt is populated from updatedAt (not null).
 * TC-04: prime_activity thread with bookingId 'activity' produces guestBookingRef: null (regression guard).
 */

/* eslint-disable import/first */
jest.mock("server-only", () => ({}));

import { listPrimeInboxThreadSummaries } from "../prime-review.server";

const UPDATED_AT = "2026-03-14T10:00:00.000Z";

function makeThreadPayload(overrides: {
  channel?: "prime_direct" | "prime_broadcast" | "prime_activity";
  bookingId?: string;
  updatedAt?: string;
} = {}) {
  return {
    id: "thread-abc-123",
    channel: overrides.channel ?? "prime_direct",
    lane: "support",
    reviewStatus: "pending",
    subject: "Hello",
    snippet: "Hello snippet",
    latestMessageAt: null,
    updatedAt: overrides.updatedAt ?? UPDATED_AT,
    latestAdmissionDecision: null,
    latestAdmissionReason: null,
    bookingId: overrides.bookingId ?? "booking-xyz",
  };
}

describe("mapPrimeSummaryToInboxThread (via listPrimeInboxThreadSummaries)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      RECEPTION_PRIME_API_BASE_URL: "https://prime.example.com",
      RECEPTION_PRIME_ACCESS_TOKEN: "test-token",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("TC-01: lastSyncedAt is populated from updatedAt", () => {
    it("returns lastSyncedAt equal to updatedAt from the API response", async () => {
      const threadPayload = makeThreadPayload({ updatedAt: UPDATED_AT });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [threadPayload],
        }),
      }) as unknown as typeof fetch;

      const threads = await listPrimeInboxThreadSummaries();

      expect(threads).toHaveLength(1);
      expect(threads[0].lastSyncedAt).toBe(UPDATED_AT);
    });

    it("lastSyncedAt is never null when updatedAt is present", async () => {
      const threadPayload = makeThreadPayload({ updatedAt: "2025-01-01T00:00:00.000Z" });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [threadPayload],
        }),
      }) as unknown as typeof fetch;

      const threads = await listPrimeInboxThreadSummaries();

      expect(threads[0].lastSyncedAt).not.toBeNull();
      expect(threads[0].lastSyncedAt).toBe("2025-01-01T00:00:00.000Z");
    });
  });

  describe("TC-04: prime_activity sentinel — guestBookingRef regression guard", () => {
    it("prime_activity channel with bookingId 'activity' produces guestBookingRef: null", async () => {
      const threadPayload = makeThreadPayload({
        channel: "prime_activity",
        bookingId: "activity",
        updatedAt: UPDATED_AT,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [threadPayload],
        }),
      }) as unknown as typeof fetch;

      const threads = await listPrimeInboxThreadSummaries();

      expect(threads).toHaveLength(1);
      expect(threads[0].guestBookingRef).toBeNull();
      // lastSyncedAt is still populated from updatedAt even for prime_activity
      expect(threads[0].lastSyncedAt).toBe(UPDATED_AT);
    });

    it("prime_direct channel with real bookingId produces non-null guestBookingRef", async () => {
      const threadPayload = makeThreadPayload({
        channel: "prime_direct",
        bookingId: "booking-123",
        updatedAt: UPDATED_AT,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [threadPayload],
        }),
      }) as unknown as typeof fetch;

      const threads = await listPrimeInboxThreadSummaries();

      expect(threads[0].guestBookingRef).toBe("booking-123");
    });
  });
});
