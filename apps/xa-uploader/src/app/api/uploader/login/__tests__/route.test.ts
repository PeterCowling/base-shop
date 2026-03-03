import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const issueUploaderSessionMock = jest.fn();
const setUploaderCookieMock = jest.fn();
const validateUploaderAdminTokenMock = jest.fn();
const readJsonBodyWithLimitMock = jest.fn();
const isUploaderIpAllowedByHeadersMock = jest.fn();

class InvalidJsonErrorMock extends Error {}
class PayloadTooLargeErrorMock extends Error {}

jest.mock("../../../../../lib/uploaderAuth", () => ({
  issueUploaderSession: (...args: unknown[]) => issueUploaderSessionMock(...args),
  setUploaderCookie: (...args: unknown[]) => setUploaderCookieMock(...args),
  validateUploaderAdminToken: (...args: unknown[]) => validateUploaderAdminTokenMock(...args),
}));

jest.mock("../../../../../lib/requestJson", () => ({
  InvalidJsonError: InvalidJsonErrorMock,
  PayloadTooLargeError: PayloadTooLargeErrorMock,
  readJsonBodyWithLimit: (...args: unknown[]) => readJsonBodyWithLimitMock(...args),
}));

jest.mock("../../../../../lib/accessControl", () => ({
  isUploaderIpAllowedByHeaders: (...args: unknown[]) => isUploaderIpAllowedByHeadersMock(...args),
  uploaderAccessDeniedJsonResponse: () => new Response(JSON.stringify({ ok: false }), { status: 404 }),
}));

describe("uploader login route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as { __xaUploaderRateLimitStore?: unknown }).__xaUploaderRateLimitStore = undefined;
    issueUploaderSessionMock.mockResolvedValue("session-token-1");
    validateUploaderAdminTokenMock.mockResolvedValue(true);
    readJsonBodyWithLimitMock.mockResolvedValue({ token: "good-token" });
    isUploaderIpAllowedByHeadersMock.mockReturnValue(true);
  });

  it("returns 404 when request IP is not allowlisted", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(false);
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/uploader/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "good-token" }),
      }),
    );
    expect(response.status).toBe(404);
    expect(validateUploaderAdminTokenMock).not.toHaveBeenCalled();
    expect(issueUploaderSessionMock).not.toHaveBeenCalled();
  });

  it("returns invalid for malformed JSON", async () => {
    readJsonBodyWithLimitMock.mockRejectedValueOnce(new InvalidJsonErrorMock("invalid"));
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/uploader/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: false, error: "invalid" }));
    expect(validateUploaderAdminTokenMock).not.toHaveBeenCalled();
    expect(issueUploaderSessionMock).not.toHaveBeenCalled();
    expect(setUploaderCookieMock).not.toHaveBeenCalled();
  });

  it("returns payload_too_large when request body exceeds max bytes", async () => {
    readJsonBodyWithLimitMock.mockRejectedValueOnce(new PayloadTooLargeErrorMock("too large"));
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/uploader/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: false, error: "payload_too_large" }));
  });

  it("returns missing when token is blank", async () => {
    readJsonBodyWithLimitMock.mockResolvedValueOnce({ token: "   " });
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/uploader/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: false, error: "missing" }));
    expect(validateUploaderAdminTokenMock).not.toHaveBeenCalled();
    expect(issueUploaderSessionMock).not.toHaveBeenCalled();
    expect(setUploaderCookieMock).not.toHaveBeenCalled();
  });

  it("returns unauthorized when token validation fails", async () => {
    validateUploaderAdminTokenMock.mockResolvedValueOnce(false);
    readJsonBodyWithLimitMock.mockResolvedValueOnce({ token: "bad-token" });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/uploader/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "bad-token" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "unauthorized" }),
    );
    expect(issueUploaderSessionMock).not.toHaveBeenCalled();
    expect(setUploaderCookieMock).not.toHaveBeenCalled();
  });

  it("falls back to invalid when JSON reader throws unknown error", async () => {
    readJsonBodyWithLimitMock.mockRejectedValueOnce(new Error("unexpected reader failure"));
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/uploader/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: false, error: "invalid" }));
  });

  it("issues session and sets cookie for valid token", async () => {
    readJsonBodyWithLimitMock.mockResolvedValueOnce({ token: "good-token" });
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/uploader/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "good-token" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true }));
    expect(validateUploaderAdminTokenMock).toHaveBeenCalledWith("good-token");
    expect(issueUploaderSessionMock).toHaveBeenCalledTimes(1);
    expect(setUploaderCookieMock).toHaveBeenCalledTimes(1);
    expect(setUploaderCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200 }),
      "session-token-1",
    );
  });

  it("rate limits repeated login attempts from the same IP", async () => {
    validateUploaderAdminTokenMock.mockResolvedValue(false);
    readJsonBodyWithLimitMock.mockResolvedValue({ token: "bad-token" });
    const { POST } = await import("../route");
    const request = () =>
      new Request("http://localhost/api/uploader/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cf-connecting-ip": "203.0.113.40",
        },
        body: JSON.stringify({ token: "ignored-by-mock" }),
      });

    for (let i = 0; i < 10; i += 1) {
      const response = await POST(request());
      expect(response.status).toBe(401);
    }

    const blocked = await POST(request());
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual(
      expect.objectContaining({ ok: false, error: "rate_limited" }),
    );
  });
});
