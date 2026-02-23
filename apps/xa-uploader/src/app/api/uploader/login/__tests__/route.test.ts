import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const issueUploaderSessionMock = jest.fn();
const setUploaderCookieMock = jest.fn();
const validateUploaderAdminTokenMock = jest.fn();

jest.mock("../../../../../lib/uploaderAuth", () => ({
  issueUploaderSession: (...args: unknown[]) => issueUploaderSessionMock(...args),
  setUploaderCookie: (...args: unknown[]) => setUploaderCookieMock(...args),
  validateUploaderAdminToken: (...args: unknown[]) => validateUploaderAdminTokenMock(...args),
}));

describe("uploader login route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    issueUploaderSessionMock.mockResolvedValue("session-token-1");
    validateUploaderAdminTokenMock.mockResolvedValue(true);
  });

  it("returns invalid for malformed JSON", async () => {
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

  it("returns missing when token is blank", async () => {
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

  it("issues session and sets cookie for valid token", async () => {
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
});
