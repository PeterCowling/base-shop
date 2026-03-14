import { sendSystemEmail } from "@acme/platform-core/email";

import { POST } from "./route";

jest.mock("@acme/platform-core/email", () => ({
  sendSystemEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockSendSystemEmail = sendSystemEmail as jest.MockedFunction<typeof sendSystemEmail>;

describe("POST /api/returns-request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/returns-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "validation_error",
    });
    expect(mockSendSystemEmail).not.toHaveBeenCalled();
  });

  it("sends merchant and customer emails for a valid request", async () => {
    const response = await POST(
      new Request("http://localhost/api/returns-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderReference: "ORD-123",
          email: "buyer@example.com",
          requestType: "return",
          message: "I would like to return this item because it does not suit me.",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSendSystemEmail).toHaveBeenCalledTimes(2);
    expect(mockSendSystemEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "hostelpositano@gmail.com",
        subject: "Return request — ORD-123",
      }),
    );
    expect(mockSendSystemEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: "buyer@example.com",
        subject: "We received your return request — ORD-123",
      }),
    );
  });
});
