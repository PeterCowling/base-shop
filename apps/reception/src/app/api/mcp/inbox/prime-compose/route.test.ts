/**
 * Tests for POST /api/mcp/inbox/prime-compose (updated for single-hop staffBroadcastSend)
 *
 * TC-01: Valid auth + { text: "Hello" } + staffBroadcastSend returns OK → 200 { success: true }.
 * TC-02: No auth header → 401.
 * TC-03: Empty text → 400 "text is required".
 * TC-04: staffBroadcastSend returns null → 503 "Prime messaging not configured".
 * TC-05: staffBroadcastSend throws → 502 "Failed to send broadcast".
 * TC-06: Success path → inbox event prime_broadcast_initiated recorded.
 */

import {
  buildPrimeInboxThreadId,
  staffBroadcastSend,
} from "@/lib/inbox/prime-review.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../../_shared/staff-auth";

import { POST } from "./route";

jest.mock("@/lib/inbox/prime-review.server", () => ({
  buildPrimeInboxThreadId: jest.fn(),
  staffBroadcastSend: jest.fn(),
}));

jest.mock("@/lib/inbox/telemetry.server", () => ({
  recordInboxEvent: jest.fn(),
}));

jest.mock("../../_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

const mockRequireStaffAuth = jest.mocked(requireStaffAuth);
const mockStaffBroadcastSend = jest.mocked(staffBroadcastSend);
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

describe("POST /api/mcp/inbox/prime-compose", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockBuildPrimeInboxThreadId.mockReturnValue("prime:broadcast_whole_hostel");
  });

  describe("TC-01: Valid auth + text + Prime OK → 200 { success: true }", () => {
    it("returns 200 with success: true when staffBroadcastSend succeeds", async () => {
      mockAuthOk();
      mockStaffBroadcastSend.mockResolvedValue({ sentMessageId: "msg_123" });
      mockRecordInboxEvent.mockResolvedValue(undefined as never);

      const response = await POST(buildRequest({ text: "Hello hostel!" }));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });

      expect(mockStaffBroadcastSend).toHaveBeenCalledWith({
        text: "Hello hostel!",
        actorUid: "staff-uid-123",
        roles: ["owner"],
      });
    });

    it("trims whitespace from text before passing to staffBroadcastSend", async () => {
      mockAuthOk();
      mockStaffBroadcastSend.mockResolvedValue({ sentMessageId: null });
      mockRecordInboxEvent.mockResolvedValue(undefined as never);

      await POST(buildRequest({ text: "  padded text  " }));

      expect(mockStaffBroadcastSend).toHaveBeenCalledWith(
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
      expect(mockStaffBroadcastSend).not.toHaveBeenCalled();
    });
  });

  describe("TC-03: Empty text → 400", () => {
    it("returns 400 when text is empty string", async () => {
      mockAuthOk();

      const response = await POST(buildRequest({ text: "" }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("text is required");
      expect(mockStaffBroadcastSend).not.toHaveBeenCalled();
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

  describe("TC-04: staffBroadcastSend returns null → 503", () => {
    it("returns 503 when Prime config is absent (staffBroadcastSend returns null)", async () => {
      mockAuthOk();
      mockStaffBroadcastSend.mockResolvedValue(null);

      const response = await POST(buildRequest({ text: "Hello" }));
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.error).toBe("Prime messaging not configured");
    });
  });

  describe("TC-05: staffBroadcastSend throws → 502", () => {
    it("returns 502 when staffBroadcastSend throws", async () => {
      mockAuthOk();
      mockStaffBroadcastSend.mockRejectedValue(new Error("Failed to reach Prime messaging service"));

      const response = await POST(buildRequest({ text: "Hello" }));
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toBe("Failed to send broadcast");
    });
  });

  describe("TC-06: Success path → prime_broadcast_initiated event recorded", () => {
    it("records prime_broadcast_initiated event with actor uid and correct threadId on success", async () => {
      mockAuthOk("staff-abc");
      mockStaffBroadcastSend.mockResolvedValue({ sentMessageId: "msg_xyz" });
      mockRecordInboxEvent.mockResolvedValue(undefined as never);

      await POST(buildRequest({ text: "Hello hostel team!" }));

      // Allow fire-and-forget void promise to settle
      await Promise.resolve();

      expect(mockRecordInboxEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          threadId: "prime:broadcast_whole_hostel",
          eventType: "prime_broadcast_initiated",
          actorUid: "staff-abc",
        }),
      );
    });

    it("uses buildPrimeInboxThreadId with literal broadcast_whole_hostel for telemetry threadId", async () => {
      mockAuthOk();
      mockStaffBroadcastSend.mockResolvedValue({ sentMessageId: null });
      mockRecordInboxEvent.mockResolvedValue(undefined as never);

      await POST(buildRequest({ text: "Thread id test" }));

      expect(mockBuildPrimeInboxThreadId).toHaveBeenCalledWith("broadcast_whole_hostel");
    });
  });
});
