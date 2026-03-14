/**
 * Tests for listPrimeInboxThreadSummaries() retry behaviour (TASK-01).
 *
 * primeRequest<T>() is private and cannot be accessed directly.
 * All retry assertions are exercised via the exported
 * listPrimeInboxThreadSummaries() function, which passes retry: true.
 *
 * TC-01: fetch rejects on first call, resolves on second call →
 *        listPrimeInboxThreadSummaries() returns mapped thread summaries.
 * TC-02: fetch returns { ok: false } on first call, { ok: true, success: true }
 *        on second call → listPrimeInboxThreadSummaries() returns mapped summaries.
 * TC-03: fetch resolves successfully on first call →
 *        result returned; fetch called exactly once (no spurious retry).
 * TC-04: fetch rejects on both calls →
 *        listPrimeInboxThreadSummaries() throws "Failed to load Prime threads".
 */

/* eslint-disable import/first */
jest.mock("server-only", () => ({}));

import { listPrimeInboxThreadSummaries } from "../prime-review.server";

const mockSummary = {
  id: "thread-abc",
  channel: "prime_direct" as const,
  lane: "support" as const,
  reviewStatus: "pending" as const,
  subject: "Test subject",
  snippet: "Test snippet",
  latestMessageAt: null,
  updatedAt: "2026-03-14T00:00:00.000Z",
  latestAdmissionDecision: null,
  latestAdmissionReason: null,
  bookingId: "booking-001",
};

function buildSuccessEnvelope(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data }),
  };
}

function buildErrorEnvelope() {
  return {
    ok: false,
    status: 503,
    json: async () => ({ success: false, error: "Service unavailable" }),
  };
}

describe("listPrimeInboxThreadSummaries() — retry behaviour (TASK-01)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    process.env = {
      ...originalEnv,
      RECEPTION_PRIME_API_BASE_URL: "https://prime.example.com",
      RECEPTION_PRIME_ACCESS_TOKEN: "test-token",
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  describe("TC-01: fetch rejects on first call, resolves on second → returns summaries", () => {
    it("retries after a 300 ms delay and returns mapped summaries on success", async () => {
      const fetchMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network failure"))
        .mockResolvedValueOnce(buildSuccessEnvelope([mockSummary]));
      global.fetch = fetchMock as unknown as typeof fetch;

      const promise = listPrimeInboxThreadSummaries();

      // Advance past the 300 ms retry delay
      await jest.advanceTimersByTimeAsync(300);

      const result = await promise;

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("prime:thread-abc");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("TC-02: non-OK first response, OK second response → returns summaries", () => {
    it("retries after a 300 ms delay when first response is non-OK", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(buildErrorEnvelope())
        .mockResolvedValueOnce(buildSuccessEnvelope([mockSummary]));
      global.fetch = fetchMock as unknown as typeof fetch;

      const promise = listPrimeInboxThreadSummaries();
      await jest.advanceTimersByTimeAsync(300);

      const result = await promise;

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("prime:thread-abc");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("TC-03: first call succeeds → result returned, fetch called exactly once", () => {
    it("does not retry when the first fetch succeeds", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(buildSuccessEnvelope([mockSummary]));
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await listPrimeInboxThreadSummaries();

      expect(result).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("TC-04: fetch rejects on both calls → throws expected error", () => {
    it("throws 'Failed to load Prime threads' after both attempts fail", async () => {
      const fetchMock = jest
        .fn()
        .mockRejectedValue(new Error("Network failure"));
      global.fetch = fetchMock as unknown as typeof fetch;

      const promise = listPrimeInboxThreadSummaries();
      await jest.advanceTimersByTimeAsync(300);

      await expect(promise).rejects.toThrow("Failed to load Prime threads");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
