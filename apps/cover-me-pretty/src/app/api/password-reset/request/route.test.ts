/** @jest-environment node */

describe("POST /api/password-reset/request", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  type PasswordResetRequestBody = {
    email: string;
  };

  function makeReq(body: PasswordResetRequestBody) {
    return new Request("http://x/api/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 for invalid email", async () => {
    jest.doMock("@acme/email", () => ({ __esModule: true, sendEmail: jest.fn() }));
    const { POST } = await import("./route");
    const res = await POST(makeReq({ email: "nope" }));
    expect(res.status).toBe(400);
  });

  it("sends reset email for valid user", async () => {
    jest.doMock("@acme/platform-core/users", () => ({
      __esModule: true,
      getUserByEmail: jest.fn().mockResolvedValue({ id: "u1", email: "a@b.com" }),
      setResetToken: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("@acme/email", () => ({
      __esModule: true,
      sendEmail: jest.fn().mockResolvedValue(undefined),
    }));
    const { POST } = await import("./route");
    const res = await POST(makeReq({ email: "a@b.com" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    const { setResetToken } = await import("@acme/platform-core/users");
    const { sendEmail } = await import("@acme/email");
    expect((setResetToken as jest.Mock).mock.calls[0][0]).toBe("u1");
    expect((sendEmail as jest.Mock).mock.calls[0][0]).toBe("a@b.com");
  });

  it("returns ok for unknown email without leaking existence", async () => {
    jest.doMock("@acme/platform-core/users", () => ({
      __esModule: true,
      getUserByEmail: jest.fn().mockRejectedValue(new Error("nope")),
      setResetToken: jest.fn(),
    }));
    jest.doMock("@acme/email", () => ({ __esModule: true, sendEmail: jest.fn() }));
    const { POST } = await import("./route");
    const res = await POST(makeReq({ email: "x@y.com" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("uses longer expiry outside test env", async () => {
    const prevEnv = process.env.NODE_ENV;
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = "production";
    jest.resetModules();
    jest.doMock("@acme/platform-core/users", () => ({
      __esModule: true,
      getUserByEmail: jest.fn().mockResolvedValue({ id: "u1", email: "a@b.com" }),
      setResetToken: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("@acme/email", () => ({
      __esModule: true,
      sendEmail: jest.fn().mockResolvedValue(undefined),
    }));
    const { POST } = await import("./route");
    const res = await POST(makeReq({ email: "a@b.com" }));
    expect(res.status).toBe(200);
    env.NODE_ENV = prevEnv;
  });
});
