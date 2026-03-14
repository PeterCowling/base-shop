/**
 * Tests for sendPrimeInboxThread routing-branch removal (TASK-05 / C-01 fix).
 *
 * Prior to this fix, sendPrimeInboxThread had a special-case branch that routed
 * prime_broadcast threads with an active campaign to /api/review-campaign-send.
 * That branch has been removed as part of the single-hop refactor.
 *
 * TC-01: Always routes to /api/review-thread-send regardless of channel type.
 * TC-02: /api/review-campaign-send is never called — even when a broadcast thread
 *        with a campaign ID would historically have triggered the old branch.
 * TC-03: Returns null sentMessageId + null draft when threadId has no prime prefix.
 */

/* eslint-disable import/first */
jest.mock("server-only", () => ({}));

import { sendPrimeInboxThread } from "../prime-review.server";

describe("sendPrimeInboxThread — routing-branch removal (C-01)", () => {
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

  describe("TC-01: Always routes to /api/review-thread-send", () => {
    it("calls review-thread-send for a standard direct thread", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            thread: {
              id: "direct-thread-abc",
              channel: "prime_direct",
              lane: "support",
              reviewStatus: "sent",
              subject: null,
              snippet: null,
              latestMessageAt: null,
              updatedAt: "2026-03-14T00:00:00.000Z",
              latestAdmissionDecision: null,
              latestAdmissionReason: null,
              bookingId: "booking-123",
            },
            draft: null,
            sentMessageId: "msg_abc",
          },
        }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await sendPrimeInboxThread(
        "prime:direct-thread-abc",
        "staff-uid-123",
      );

      expect(result.sentMessageId).toBe("msg_abc");

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/review-thread-send");
      expect(url).not.toContain("review-campaign-send");
    });

    it("calls review-thread-send for a broadcast thread (no campaign-send branch)", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            thread: {
              id: "broadcast_whole_hostel",
              channel: "prime_broadcast",
              lane: "promotion",
              reviewStatus: "sent",
              subject: null,
              snippet: null,
              latestMessageAt: null,
              updatedAt: "2026-03-14T00:00:00.000Z",
              latestAdmissionDecision: null,
              latestAdmissionReason: null,
              bookingId: "",
            },
            draft: null,
            sentMessageId: "msg_broadcast",
          },
        }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await sendPrimeInboxThread(
        "prime:broadcast_whole_hostel",
        "staff-uid-123",
      );

      expect(result.sentMessageId).toBe("msg_broadcast");

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/review-thread-send");
      expect(url).not.toContain("review-campaign-send");
    });
  });

  describe("TC-02: /api/review-campaign-send is never called", () => {
    it("never calls review-campaign-send even for a broadcast thread that previously had a campaign", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            thread: {
              id: "broadcast_whole_hostel",
              channel: "prime_broadcast",
              lane: "promotion",
              reviewStatus: "sent",
              subject: null,
              snippet: null,
              latestMessageAt: null,
              updatedAt: "2026-03-14T00:00:00.000Z",
              latestAdmissionDecision: null,
              latestAdmissionReason: null,
              bookingId: "",
            },
            draft: null,
            sentMessageId: "msg_broadcast",
          },
        }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      await sendPrimeInboxThread("prime:broadcast_whole_hostel");

      // Verify no calls went to review-campaign-send
      const calledUrls = fetchMock.mock.calls.map(
        ([url]: [string]) => url as string,
      );
      expect(calledUrls.every((u) => !u.includes("review-campaign-send"))).toBe(
        true,
      );
    });
  });

  describe("TC-03: Unprefixed threadId returns null draft and sentMessageId", () => {
    it("returns null draft and sentMessageId without calling fetch when prefix is missing", async () => {
      const fetchMock = jest.fn();
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await sendPrimeInboxThread("broadcast_whole_hostel");

      expect(result.draft).toBeNull();
      expect(result.sentMessageId).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
