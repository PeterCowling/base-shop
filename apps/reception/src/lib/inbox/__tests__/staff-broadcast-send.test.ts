/**
 * @jest-environment node
 *
 * Tests for staffBroadcastSend (reception-prime-deprecated-endpoint-cleanup)
 *
 * staffBroadcastSend is the replacement for the deprecated initiatePrimeOutboundThread.
 * It calls POST /api/staff-broadcast-send via the shared primeRequest helper, which
 * uses buildPrimeActorHeaders to sign actor claims before the fetch.
 *
 * This file preserves the header-construction and signing contract that was previously
 * covered by initiate-prime-outbound-thread.test.ts, now that that file is deleted.
 *
 * TC-01: actorUid provided → x-prime-actor-claims header present and signed (b64url.b64url format)
 * TC-02: actorUid absent  → x-prime-actor-claims header absent
 * TC-03: Prime config absent (no RECEPTION_PRIME_API_BASE_URL) → returns null without calling fetch
 * TC-04: Prime config absent (no RECEPTION_PRIME_ACCESS_TOKEN) → returns null without calling fetch
 * TC-05: Network error from fetch → propagates as "Failed to reach Prime messaging service"
 * TC-06: Non-ok HTTP response from Prime → propagates as "Failed to load Prime threads"
 * TC-07: 200 response → returns { sentMessageId } unwrapped from envelope
 */

/* eslint-disable import/first */
jest.mock("server-only", () => ({}));

import { staffBroadcastSend } from "../prime-review.server";

function buildPrimeEnvelope<T>(data: T) {
  return { success: true, data };
}

describe("staffBroadcastSend (header construction and config gate)", () => {
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

  describe("TC-01: actorUid provided → x-prime-actor-claims header present and signed", () => {
    it("posts to /api/staff-broadcast-send with signed actor claims header when actorUid is provided", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => buildPrimeEnvelope({ outcome: "sent", sentMessageId: "msg_abc" }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await staffBroadcastSend({
        text: "Hello hostel!",
        actorUid: "staff-uid-123",
        roles: ["owner"],
      });

      expect(result).not.toBeNull();
      expect(result?.sentMessageId).toBe("msg_abc");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://prime.example.com/api/staff-broadcast-send");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual({ plainText: "Hello hostel!" });

      // Signed header must be present and match the b64url-payload.b64url-sig format
      const headers = init.headers as Record<string, string>;
      expect(headers["x-prime-actor-claims"]).toBeDefined();
      expect(typeof headers["x-prime-actor-claims"]).toBe("string");
      expect(headers["x-prime-actor-claims"]).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });
  });

  describe("TC-02: actorUid absent → x-prime-actor-claims header absent", () => {
    it("omits x-prime-actor-claims header when actorUid is not provided", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => buildPrimeEnvelope({ outcome: "sent", sentMessageId: null }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      await staffBroadcastSend({ text: "No actor" });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string> | undefined;
      // buildPrimeActorHeaders(undefined) returns undefined — no actor header merged
      expect(headers?.["x-prime-actor-claims"]).toBeUndefined();
    });
  });

  describe("TC-03 & TC-04: Prime config absent → returns null without calling fetch", () => {
    it("returns null when RECEPTION_PRIME_API_BASE_URL is not set", async () => {
      delete process.env.RECEPTION_PRIME_API_BASE_URL;

      const fetchMock = jest.fn();
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await staffBroadcastSend({ text: "Hello" });

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns null when RECEPTION_PRIME_ACCESS_TOKEN is not set", async () => {
      delete process.env.RECEPTION_PRIME_ACCESS_TOKEN;

      const fetchMock = jest.fn();
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await staffBroadcastSend({ text: "Hello" });

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("TC-05: network error from fetch → propagates throw", () => {
    it("propagates network errors from fetch as 'Failed to reach Prime messaging service'", async () => {
      const fetchMock = jest.fn().mockRejectedValue(new Error("Network failure"));
      global.fetch = fetchMock as unknown as typeof fetch;

      await expect(staffBroadcastSend({ text: "Hello" })).rejects.toThrow(
        "Failed to reach Prime messaging service",
      );
    });
  });

  describe("TC-06: non-ok HTTP response → propagates throw", () => {
    it("propagates non-ok HTTP responses as 'Failed to load Prime threads'", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ success: false, error: "Conflict" }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      await expect(staffBroadcastSend({ text: "Hello" })).rejects.toThrow(
        "Failed to load Prime threads",
      );
    });
  });

  describe("TC-07: 200 response → returns sentMessageId", () => {
    it("returns { sentMessageId } unwrapped from the Prime envelope", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => buildPrimeEnvelope({ outcome: "sent", sentMessageId: "msg_xyz" }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await staffBroadcastSend({
        text: "Hello hostel!",
        actorUid: "owner-uid",
      });

      expect(result).not.toBeNull();
      expect(result?.sentMessageId).toBe("msg_xyz");
    });
  });
});
