/**
 * Tests for mapPrimeSummaryToInboxThread behaviour exercised via listPrimeInboxThreadSummaries.
 *
 * mapPrimeSummaryToInboxThread is not exported, so these tests exercise it through the
 * exported listPrimeInboxThreadSummaries() function with a mocked global fetch.
 * This is the established pattern used in send-prime-inbox-thread.test.ts.
 *
 * TC-01: lastSyncedAt is populated from updatedAt (not null).
 * TC-04: prime_activity thread with bookingId 'activity' produces guestBookingRef: null (regression guard).
 *
 * TC-08: Guest name augmentation via fetchPrimeGuestNames.
 *   TC-08a: prime_direct thread → guestFirstName populated from Firebase.
 *   TC-08b: prime_broadcast thread (bookingId:'') → Firebase not called; guestFirstName: null.
 *   TC-08c: Firebase failure → guestFirstName: null; no throw.
 *   TC-08d: prime_activity thread → guestFirstName: null; Firebase not called.
 */

/* eslint-disable import/first */
jest.mock("server-only", () => ({}));

import { listPrimeInboxThreadSummaries } from "../prime-review.server";

const FIREBASE_BASE = "https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app";

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

  describe("TC-08: guest name augmentation via fetchPrimeGuestNames", () => {
    /**
     * Builds a three-way URL-routing mock:
     *   1. Prime API URL (/api/review-threads) → returns the given thread list
     *   2. Firebase bookings URL (/bookings/<ref>) → returns bookings payload
     *   3. Firebase guestsDetails URL (/guestsDetails/<ref>) → returns details payload
     */
    function makeTripleMock(
      threads: ReturnType<typeof makeThreadPayload>[],
      bookingRef: string,
      bookingsPayload: object | null,
      detailsPayload: object | null,
    ) {
      return jest.fn().mockImplementation((url: string) => {
        // Prime API call
        if (url.includes("/api/review-threads")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: threads }),
          });
        }
        // Firebase bookings leg
        if (url.includes(`/bookings/${bookingRef}`)) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => bookingsPayload,
          });
        }
        // Firebase guestsDetails leg
        if (url.includes(`/guestsDetails/${bookingRef}`)) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => detailsPayload,
          });
        }
        return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
      });
    }

    beforeEach(() => {
      process.env = {
        ...process.env,
        NEXT_PUBLIC_FIREBASE_DATABASE_URL: FIREBASE_BASE,
        FIREBASE_DB_SECRET: "test-secret",
      };
    });

    it("TC-08a: prime_direct thread → guestFirstName populated from Firebase lead guest", async () => {
      const thread = makeThreadPayload({ channel: "prime_direct", bookingId: "booking-xyz" });
      const bookingsPayload = {
        "occ-1": { checkInDate: "2026-03-14", checkOutDate: "2026-03-16", leadGuest: true },
      };
      const detailsPayload = {
        "occ-1": { email: "guest@example.com", firstName: "Ingrid", lastName: "Muller" },
      };

      global.fetch = makeTripleMock([thread], "booking-xyz", bookingsPayload, detailsPayload) as unknown as typeof fetch;

      const threads = await listPrimeInboxThreadSummaries();

      expect(threads).toHaveLength(1);
      expect(threads[0].guestFirstName).toBe("Ingrid");
      expect(threads[0].guestLastName).toBe("Muller");
    });

    it("TC-08b: prime_broadcast thread (bookingId:'') → Firebase not called for broadcast; guestFirstName: null", async () => {
      const thread = makeThreadPayload({ channel: "prime_broadcast", bookingId: "" });

      const fetchMock = jest.fn().mockImplementation((url: string) => {
        // Only the Prime API call is expected; Firebase must not be called
        if (url.includes("/api/review-threads")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: [thread] }),
          });
        }
        return Promise.reject(new Error(`Unexpected Firebase call for broadcast thread: ${url}`));
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const threads = await listPrimeInboxThreadSummaries();

      expect(threads).toHaveLength(1);
      expect(threads[0].guestFirstName).toBeNull();
      // Verify no Firebase URL was called (only Prime API URL)
      const callUrls = (fetchMock.mock.calls as [string][]).map(([url]) => url);
      expect(callUrls.every((url) => url.includes("/api/review-threads"))).toBe(true);
    });

    it("TC-08c: Firebase failure → guestFirstName: null; no throw from listPrimeInboxThreadSummaries", async () => {
      const thread = makeThreadPayload({ channel: "prime_direct", bookingId: "booking-xyz" });

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes("/api/review-threads")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: [thread] }),
          });
        }
        // Firebase legs throw
        return Promise.reject(new Error("Firebase unavailable"));
      }) as unknown as typeof fetch;

      // Must not throw
      const threads = await listPrimeInboxThreadSummaries();

      expect(threads).toHaveLength(1);
      expect(threads[0].guestFirstName).toBeNull();
    });

    it("TC-08d: prime_activity thread → guestFirstName: null; Firebase not called", async () => {
      const thread = makeThreadPayload({ channel: "prime_activity", bookingId: "activity" });

      const fetchMock = jest.fn().mockImplementation((url: string) => {
        if (url.includes("/api/review-threads")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: [thread] }),
          });
        }
        return Promise.reject(new Error(`Unexpected Firebase call for activity thread: ${url}`));
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const threads = await listPrimeInboxThreadSummaries();

      expect(threads).toHaveLength(1);
      expect(threads[0].guestFirstName).toBeNull();
      // Verify no Firebase URL was called
      const callUrls = (fetchMock.mock.calls as [string][]).map(([url]) => url);
      expect(callUrls.every((url) => url.includes("/api/review-threads"))).toBe(true);
    });
  });
});
