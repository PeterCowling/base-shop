import { sendGuestEmailActivity } from "@acme/mcp-server/guest-email-activity";

import { requireStaffAuth } from "../_shared/staff-auth";
import { POST } from "../guest-email-activity/route";

jest.mock("@acme/mcp-server/guest-email-activity", () => ({
  sendGuestEmailActivity: jest.fn(),
}));

jest.mock("../_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/mcp/guest-email-activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function buildRawRequest(body: string): Request {
  return new Request("http://localhost/api/mcp/guest-email-activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("guest-email-activity route auth + payload validation", () => {
  const sendGuestEmailActivityMock = jest.mocked(sendGuestEmailActivity);
  const requireStaffAuthMock = jest.mocked(requireStaffAuth);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 401 when auth fails", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ success: false, error: "Missing bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await POST(buildRequest({ bookingRef: "BOOK1", activityCode: 21 }));
    const payload = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(401);
    expect(payload.success).toBe(false);
    expect(sendGuestEmailActivityMock).not.toHaveBeenCalled();
  });

  it("returns 403 when non-staff role is rejected", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ success: false, error: "Insufficient role" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await POST(buildRequest({ bookingRef: "BOOK1", activityCode: 21 }));
    const payload = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(sendGuestEmailActivityMock).not.toHaveBeenCalled();
  });

  it("returns 422 for malformed payloads", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });

    const response = await POST(
      buildRequest({ bookingRef: "BOOK1", activityCode: 21, recipients: ["bad-email"] })
    );
    const payload = (await response.json()) as {
      success: boolean;
      code: string;
      error: string;
      details: Array<{ code: string; message: string; path: string }>;
    };

    expect(response.status).toBe(422);
    expect(payload.success).toBe(false);
    expect(payload.code).toBe("INVALID_PAYLOAD");
    expect(payload.error).toBe("Invalid guest email activity payload");
    expect(payload.details.length).toBeGreaterThan(0);
    expect(sendGuestEmailActivityMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });

    const response = await POST(buildRawRequest("{not valid json"));
    const payload = (await response.json()) as {
      success: boolean;
      code: string;
      error: string;
    };

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      success: false,
      code: "INVALID_JSON",
      error: "Invalid JSON payload",
    });
    expect(sendGuestEmailActivityMock).not.toHaveBeenCalled();
  });

  it("returns 502 when MCP tool throws", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    sendGuestEmailActivityMock.mockRejectedValue(new Error("Missing bearer token"));

    const response = await POST(
      buildRequest({
        bookingRef: "BOOK1",
        activityCode: 21,
        recipients: ["a@example.com"],
      })
    );
    const payload = (await response.json()) as {
      success: boolean;
      code: string;
      error: string;
    };

    expect(response.status).toBe(502);
    expect(payload).toEqual({
      success: false,
      code: "MCP_TOOL_ERROR",
      error: "Missing bearer token",
    });
  });

  it("returns 200 and forwards payload for authorized staff", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    sendGuestEmailActivityMock.mockResolvedValue({ success: true, status: "drafted", draftId: "draft-1" });

    const response = await POST(
      buildRequest({
        bookingRef: "BOOK1",
        activityCode: 21,
        recipients: ["a@example.com"],
      })
    );
    const payload = (await response.json()) as { success: boolean; status: string; draftId: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true, status: "drafted", draftId: "draft-1" });
    expect(sendGuestEmailActivityMock).toHaveBeenCalledWith({
      bookingRef: "BOOK1",
      activityCode: 21,
      recipients: ["a@example.com"],
    });
  });
});
