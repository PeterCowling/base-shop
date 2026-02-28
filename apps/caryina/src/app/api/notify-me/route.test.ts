import { NextRequest } from "next/server";

import { POST } from "@/app/api/notify-me/route";

jest.mock("@acme/platform-core/email", () => ({
  sendSystemEmail: jest.fn(),
}));

const { sendSystemEmail } = jest.requireMock("@acme/platform-core/email") as {
  sendSystemEmail: jest.Mock;
};

const makeReq = (body?: unknown) =>
  new NextRequest("http://localhost/api/notify-me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

describe("POST /api/notify-me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("TC-01: valid body returns 200 { success: true } and calls sendSystemEmail twice", async () => {
    sendSystemEmail.mockResolvedValue(undefined);

    const res = await POST(
      makeReq({
        email: "test@example.com",
        productSlug: "rose-charm",
        consent: true,
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);

    // Wait a tick for fire-and-forget promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sendSystemEmail).toHaveBeenCalledTimes(2);
    // Subscriber confirmation
    expect(sendSystemEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: expect.stringContaining("rose-charm"),
      }),
    );
    // Merchant notification
    expect(sendSystemEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("rose-charm"),
        html: expect.stringContaining("***@example.com"),
      }),
    );
  });

  it("TC-02: consent: false returns 400 { error: 'Consent required' }", async () => {
    const res = await POST(
      makeReq({
        email: "test@example.com",
        productSlug: "rose-charm",
        consent: false,
      }) as never,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Consent required");
    expect(sendSystemEmail).not.toHaveBeenCalled();
  });

  it("TC-03: consent absent returns 400", async () => {
    const res = await POST(
      makeReq({
        email: "test@example.com",
        productSlug: "rose-charm",
      }) as never,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Consent required");
  });

  it("TC-04: invalid email (missing @) returns 400 { error: 'Invalid email' }", async () => {
    const res = await POST(
      makeReq({
        email: "notanemail",
        productSlug: "rose-charm",
        consent: true,
      }) as never,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Invalid email");
    expect(sendSystemEmail).not.toHaveBeenCalled();
  });

  it("TC-05: productSlug absent returns 400 { error: 'Product slug required' }", async () => {
    const res = await POST(
      makeReq({
        email: "test@example.com",
        consent: true,
      }) as never,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Product slug required");
    expect(sendSystemEmail).not.toHaveBeenCalled();
  });

  it("TC-06: sendSystemEmail throws → 200 still returned (fire-and-forget)", async () => {
    sendSystemEmail.mockRejectedValue(new Error("SMTP connection refused"));

    const res = await POST(
      makeReq({
        email: "test@example.com",
        productSlug: "rose-charm",
        consent: true,
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });
});
