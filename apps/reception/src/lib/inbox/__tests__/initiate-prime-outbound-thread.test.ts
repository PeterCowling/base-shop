/**
 * Tests for initiatePrimeOutboundThread (TASK-06)
 *
 * NOTE: initiatePrimeOutboundThread is @deprecated. New broadcast sends should use
 * staffBroadcastSend (tested in ../prime-compose/route.test.ts) which calls the
 * single-hop /api/staff-broadcast-send endpoint. These tests are retained to ensure
 * the legacy function contract remains stable while callers migrate.
 *
 * TC-01: primeRequest returns 200 with detail → function returns { detail }.
 * TC-02: readPrimeReviewConfig() returns null → function returns null without calling fetch.
 * TC-03: primeRequest throws → function propagates throw.
 */

/* eslint-disable import/first */
jest.mock("server-only", () => ({}));

import { initiatePrimeOutboundThread } from "../prime-review.server";

// Minimal PrimeReviewThreadDetail shape for test responses
const mockDetail = {
  thread: {
    id: "broadcast_whole_hostel",
    channel: "prime_broadcast" as const,
    lane: "promotion" as const,
    reviewStatus: "pending" as const,
    subject: null,
    snippet: null,
    latestMessageAt: null,
    updatedAt: "2026-03-14T00:00:00.000Z",
    latestAdmissionDecision: null,
    latestAdmissionReason: null,
    bookingId: "",
    takeoverState: "none",
    suppressionReason: null,
    memberUids: [],
  },
  messages: [],
  admissions: [],
  currentDraft: null,
  currentCampaign: null,
  metadata: {},
};

function buildPrimeEnvelope<T>(data: T) {
  return { success: true, data };
}

describe("initiatePrimeOutboundThread (TASK-06)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      RECEPTION_PRIME_API_BASE_URL: "https://prime.example.com",
      RECEPTION_PRIME_ACCESS_TOKEN: "test-token",
      // Required for buildPrimeActorHeaders to sign actor claims (≥32 chars)
      PRIME_ACTOR_CLAIMS_SECRET: "test-actor-claims-secret-32chars!!",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("TC-01: Prime returns 200 with detail → function returns { detail }", () => {
    it("posts to /api/staff-initiate-thread and returns unwrapped detail", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => buildPrimeEnvelope({ detail: mockDetail }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await initiatePrimeOutboundThread({
        text: "Hello hostel!",
        actorUid: "staff-uid-123",
      });

      expect(result).not.toBeNull();
      expect(result?.detail).toBe(mockDetail);

      // Verify the correct endpoint and method were used
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://prime.example.com/api/staff-initiate-thread");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual({ plainText: "Hello hostel!" });

      // Verify signed actor claims header is present (HMAC-SHA256 signed; not plain uid)
      const headers = init.headers as Record<string, string>;
      expect(headers["x-prime-actor-claims"]).toBeDefined();
      expect(typeof headers["x-prime-actor-claims"]).toBe("string");
      // Header format: <b64url-payload>.<b64url-sig>
      expect(headers["x-prime-actor-claims"]).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });

    it("omits x-prime-actor-uid header when actorUid is not provided", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => buildPrimeEnvelope({ detail: mockDetail }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      await initiatePrimeOutboundThread({ text: "No actor" });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string> | undefined;
      // buildPrimeActorHeaders(undefined) returns undefined — no actor header merged
      expect(headers?.["x-prime-actor-claims"]).toBeUndefined();
    });
  });

  describe("TC-02: readPrimeReviewConfig() returns null → function returns null", () => {
    it("returns null when RECEPTION_PRIME_API_BASE_URL is not set", async () => {
      delete process.env.RECEPTION_PRIME_API_BASE_URL;

      const fetchMock = jest.fn();
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await initiatePrimeOutboundThread({ text: "Hello" });

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns null when RECEPTION_PRIME_ACCESS_TOKEN is not set", async () => {
      delete process.env.RECEPTION_PRIME_ACCESS_TOKEN;

      const fetchMock = jest.fn();
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await initiatePrimeOutboundThread({ text: "Hello" });

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("TC-03: primeRequest throws → function propagates throw", () => {
    it("propagates network errors from fetch", async () => {
      const fetchMock = jest.fn().mockRejectedValue(new Error("Network failure"));
      global.fetch = fetchMock as unknown as typeof fetch;

      await expect(initiatePrimeOutboundThread({ text: "Hello" })).rejects.toThrow(
        "Failed to reach Prime messaging service",
      );
    });

    it("propagates non-ok HTTP responses as errors", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ success: false, error: "Conflict" }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      await expect(initiatePrimeOutboundThread({ text: "Hello" })).rejects.toThrow(
        "Failed to load Prime threads",
      );
    });
  });
});
