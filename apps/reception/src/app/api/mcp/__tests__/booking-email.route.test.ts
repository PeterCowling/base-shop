import { sendBookingEmail } from "@acme/mcp-server/booking-email";

import { requireStaffAuth } from "../_shared/staff-auth";
import { POST } from "../booking-email/route";

jest.mock("@acme/mcp-server/booking-email", () => ({
  sendBookingEmail: jest.fn(),
}));

jest.mock("../_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/mcp/booking-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function buildRawRequest(body: string): Request {
  return new Request("http://localhost/api/mcp/booking-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("booking-email route auth + payload validation", () => {
  const sendBookingEmailMock = jest.mocked(sendBookingEmail);
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

    const response = await POST(buildRequest({ bookingRef: "BOOK1" }));
    const payload = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(401);
    expect(payload.success).toBe(false);
    expect(sendBookingEmailMock).not.toHaveBeenCalled();
  });

  it("returns 403 when non-staff role is rejected", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ success: false, error: "Insufficient role" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await POST(buildRequest({ bookingRef: "BOOK1" }));
    const payload = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(sendBookingEmailMock).not.toHaveBeenCalled();
  });

  it("returns 422 for malformed payloads", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });

    const response = await POST(buildRequest({ bookingRef: "BOOK1" }));
    const payload = (await response.json()) as {
      success: boolean;
      code: string;
      error: string;
      details: Array<{ code: string; message: string; path: string }>;
    };

    expect(response.status).toBe(422);
    expect(payload.success).toBe(false);
    expect(payload.code).toBe("INVALID_PAYLOAD");
    expect(payload.error).toBe("Invalid booking email payload");
    expect(payload.details.length).toBeGreaterThan(0);
    expect(sendBookingEmailMock).not.toHaveBeenCalled();
  });

  it("returns 422 when occupantLinks contains non-URL values", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });

    const response = await POST(
      buildRequest({
        bookingRef: "BOOK1",
        recipients: ["a@example.com"],
        occupantLinks: ["not-a-url"],
      })
    );
    const payload = (await response.json()) as {
      success: boolean;
      code: string;
      details: Array<{ path: string; message: string }>;
    };

    expect(response.status).toBe(422);
    expect(payload.success).toBe(false);
    expect(payload.code).toBe("INVALID_PAYLOAD");
    expect(
      payload.details.some(
        (detail) =>
          detail.path === "occupantLinks.0" &&
          /url/i.test(detail.message)
      )
    ).toBe(true);
    expect(sendBookingEmailMock).not.toHaveBeenCalled();
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
    expect(sendBookingEmailMock).not.toHaveBeenCalled();
  });

  it("returns 502 when MCP tool throws", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    sendBookingEmailMock.mockRejectedValue(new Error("Gmail unavailable"));

    const response = await POST(
      buildRequest({
        bookingRef: "BOOK1",
        recipients: ["a@example.com"],
        occupantLinks: ["https://example.com/occ-1"],
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
      error: "Gmail unavailable",
    });
  });

  it("returns 200 and forwards payload for authorized staff", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    sendBookingEmailMock.mockResolvedValue({ success: true, draftId: "draft-1" });

    const response = await POST(
      buildRequest({
        bookingRef: "BOOK1",
        recipients: ["a@example.com"],
        occupantLinks: ["https://example.com/occ-1"],
      })
    );
    const payload = (await response.json()) as { success: boolean; draftId: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true, draftId: "draft-1" });
    expect(sendBookingEmailMock).toHaveBeenCalledWith({
      bookingRef: "BOOK1",
      recipients: ["a@example.com"],
      occupantLinks: ["https://example.com/occ-1"],
    });
  });
});
