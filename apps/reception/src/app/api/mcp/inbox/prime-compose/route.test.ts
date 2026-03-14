/**
 * Tests for POST /api/mcp/inbox/prime-compose (TASK-07)
 *
 * TC-01: Valid auth + { text: "Hello" } + Prime returns OK → 200 { success: true }.
 * TC-02: No auth header → 401.
 * TC-03: Empty text → 400 "text is required".
 * TC-04: initiatePrimeOutboundThread returns null → 503 "Prime messaging not configured".
 * TC-05: sendPrimeInboxThread throws → 502 "Failed to send broadcast".
 * TC-06: Success path → inbox event prime_broadcast_initiated recorded.
 */

import {
  buildPrimeInboxThreadId,
  initiatePrimeOutboundThread,
  sendPrimeInboxThread,
} from "@/lib/inbox/prime-review.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../../_shared/staff-auth";

import { POST } from "./route";

jest.mock("@/lib/inbox/prime-review.server", () => ({
  buildPrimeInboxThreadId: jest.fn(),
  initiatePrimeOutboundThread: jest.fn(),
  sendPrimeInboxThread: jest.fn(),
}));

jest.mock("@/lib/inbox/telemetry.server", () => ({
  recordInboxEvent: jest.fn(),
}));

jest.mock("../../_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

const mockRequireStaffAuth = jest.mocked(requireStaffAuth);
const mockInitiatePrimeOutboundThread = jest.mocked(initiatePrimeOutboundThread);
const mockSendPrimeInboxThread = jest.mocked(sendPrimeInboxThread);
const mockBuildPrimeInboxThreadId = jest.mocked(buildPrimeInboxThreadId);
const mockRecordInboxEvent = jest.mocked(recordInboxEvent);

function buildRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/mcp/inbox/prime-compose", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function mockAuthOk(uid = "staff-uid-123") {
  mockRequireStaffAuth.mockResolvedValue({
    ok: true,
    uid,
    roles: ["owner"],
  });
}

const mockThreadDetail = {
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

describe("POST /api/mcp/inbox/prime-compose (TASK-07)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockBuildPrimeInboxThreadId.mockReturnValue("prime:broadcast_whole_hostel");
  });

  describe("TC-01: Valid auth + text + Prime OK → 200 { success: true }", () => {
    it("returns 200 with success: true when Prime initiate and send succeed", async () => {
      mockAuthOk();
      mockInitiatePrimeOutboundThread.mockResolvedValue({ detail: mockThreadDetail });
      mockSendPrimeInboxThread.mockResolvedValue({ draft: null, sentMessageId: null });
      mockRecordInboxEvent.mockResolvedValue(undefined as any);

      const response = await POST(buildRequest({ text: "Hello hostel!" }));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });

      expect(mockInitiatePrimeOutboundThread).toHaveBeenCalledWith({
        text: "Hello hostel!",
        actorUid: "staff-uid-123",
      });
      expect(mockSendPrimeInboxThread).toHaveBeenCalledWith(
        "prime:broadcast_whole_hostel",
        "staff-uid-123",
      );
    });

    it("trims whitespace from text before passing to initiate", async () => {
      mockAuthOk();
      mockInitiatePrimeOutboundThread.mockResolvedValue({ detail: mockThreadDetail });
      mockSendPrimeInboxThread.mockResolvedValue({ draft: null, sentMessageId: null });
      mockRecordInboxEvent.mockResolvedValue(undefined as any);

      await POST(buildRequest({ text: "  padded text  " }));

      expect(mockInitiatePrimeOutboundThread).toHaveBeenCalledWith(
        expect.objectContaining({ text: "padded text" }),
      );
    });
  });

  describe("TC-02: No auth header → 401", () => {
    it("returns 401 when requireStaffAuth rejects", async () => {
      mockRequireStaffAuth.mockResolvedValue({
        ok: false,
        response: new Response(
          JSON.stringify({ success: false, error: "Missing bearer token" }),
          { status: 401 },
        ),
      });

      const response = await POST(buildRequest({ text: "Hello" }));

      expect(response.status).toBe(401);
      expect(mockInitiatePrimeOutboundThread).not.toHaveBeenCalled();
    });
  });

  describe("TC-03: Empty text → 400", () => {
    it("returns 400 when text is empty string", async () => {
      mockAuthOk();

      const response = await POST(buildRequest({ text: "" }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("text is required");
      expect(mockInitiatePrimeOutboundThread).not.toHaveBeenCalled();
    });

    it("returns 400 when text is whitespace-only", async () => {
      mockAuthOk();

      const response = await POST(buildRequest({ text: "   " }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("text is required");
    });

    it("returns 400 when text field is missing", async () => {
      mockAuthOk();

      const response = await POST(buildRequest({}));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("text is required");
    });
  });

  describe("TC-04: initiatePrimeOutboundThread returns null → 503", () => {
    it("returns 503 when Prime config is absent (initiate returns null)", async () => {
      mockAuthOk();
      mockInitiatePrimeOutboundThread.mockResolvedValue(null);

      const response = await POST(buildRequest({ text: "Hello" }));
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.error).toBe("Prime messaging not configured");
      expect(mockSendPrimeInboxThread).not.toHaveBeenCalled();
    });
  });

  describe("TC-05: sendPrimeInboxThread throws → 502", () => {
    it("returns 502 when send step throws", async () => {
      mockAuthOk();
      mockInitiatePrimeOutboundThread.mockResolvedValue({ detail: mockThreadDetail });
      mockSendPrimeInboxThread.mockRejectedValue(new Error("Failed to reach Prime messaging service"));

      const response = await POST(buildRequest({ text: "Hello" }));
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toBe("Failed to send broadcast");
    });

    it("returns 502 when initiate throws", async () => {
      mockAuthOk();
      mockInitiatePrimeOutboundThread.mockRejectedValue(new Error("Prime down"));

      const response = await POST(buildRequest({ text: "Hello" }));
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toBe("Failed to send broadcast");
    });
  });

  describe("TC-06: Success path → prime_broadcast_initiated event recorded", () => {
    it("records prime_broadcast_initiated event with actor uid on success", async () => {
      mockAuthOk("staff-abc");
      mockInitiatePrimeOutboundThread.mockResolvedValue({ detail: mockThreadDetail });
      mockSendPrimeInboxThread.mockResolvedValue({ draft: null, sentMessageId: null });
      mockRecordInboxEvent.mockResolvedValue(undefined as any);

      await POST(buildRequest({ text: "Hello hostel team!" }));

      // Allow void promise to settle
      await Promise.resolve();

      expect(mockRecordInboxEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          threadId: "prime:broadcast_whole_hostel",
          eventType: "prime_broadcast_initiated",
          actorUid: "staff-abc",
        }),
      );
    });
  });
});
