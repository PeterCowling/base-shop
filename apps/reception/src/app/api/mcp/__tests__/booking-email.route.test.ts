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

describe("booking-email route auth", () => {
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

  it("returns 200 and forwards payload for authorized staff", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    sendBookingEmailMock.mockResolvedValue({ success: true, draftId: "draft-1" });

    const response = await POST(buildRequest({ bookingRef: "BOOK1", recipients: ["a@example.com"] }));
    const payload = (await response.json()) as { success: boolean; draftId: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true, draftId: "draft-1" });
    expect(sendBookingEmailMock).toHaveBeenCalledWith({
      bookingRef: "BOOK1",
      recipients: ["a@example.com"],
    });
  });
});

