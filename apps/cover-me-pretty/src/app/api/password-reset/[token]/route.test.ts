/** @jest-environment node */

describe("POST /api/password-reset/[token]", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  type PasswordResetBody = {
    password: string;
  };

  function makeReq(body: PasswordResetBody) {
    return new Request("http://x/api/password-reset/t/abc", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("validates password schema", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeReq({ password: "short" }),
      { params: { token: "t1" } },
    );
    expect(res.status).toBe(400);
  });

  it("updates password and clears token on success", async () => {
    jest.doMock("@acme/platform-core/users", () => ({
      __esModule: true,
      getUserByResetToken: jest.fn().mockResolvedValue({ id: "u1" }),
      updatePassword: jest.fn().mockResolvedValue(undefined),
      setResetToken: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("argon2", () => ({
      __esModule: true,
      default: { hash: jest.fn().mockResolvedValue("hash") },
      hash: jest.fn().mockResolvedValue("hash"),
    }));
    const { POST } = await import("./route");
    const res = await POST(
      makeReq({ password: "verysecure" }),
      { params: { token: "t1" } },
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("returns 400 for invalid/expired token", async () => {
    jest.doMock("@acme/platform-core/users", () => ({
      __esModule: true,
      getUserByResetToken: jest.fn().mockRejectedValue(new Error("bad")),
      updatePassword: jest.fn(),
      setResetToken: jest.fn(),
    }));
    jest.doMock("argon2", () => ({
      __esModule: true,
      default: { hash: jest.fn() },
      hash: jest.fn(),
    }));
    const { POST } = await import("./route");
    const res = await POST(
      makeReq({ password: "verysecure" }),
      { params: { token: "t1" } },
    );
    expect(res.status).toBe(400);
  });
});
