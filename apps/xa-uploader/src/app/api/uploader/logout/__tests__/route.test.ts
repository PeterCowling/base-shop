import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const clearUploaderCookieMock = jest.fn();
const isUploaderIpAllowedByHeadersMock = jest.fn();

jest.mock("../../../../../lib/uploaderAuth", () => ({
  clearUploaderCookie: (...args: unknown[]) => clearUploaderCookieMock(...args),
}));

jest.mock("../../../../../lib/accessControl", () => ({
  isUploaderIpAllowedByHeaders: (...args: unknown[]) => isUploaderIpAllowedByHeadersMock(...args),
  uploaderAccessDeniedJsonResponse: () => new Response(JSON.stringify({ ok: false }), { status: 404 }),
}));

describe("uploader logout route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isUploaderIpAllowedByHeadersMock.mockReturnValue(true);
  });

  it("returns 404 when request IP is not allowlisted", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(false);
    const { POST } = await import("../route");
    const response = await POST(new Request("http://localhost/api/uploader/logout", { method: "POST" }));

    expect(response.status).toBe(404);
    expect(clearUploaderCookieMock).not.toHaveBeenCalled();
  });

  it("clears cookie and returns ok response", async () => {
    const { POST } = await import("../route");
    const response = await POST(new Request("http://localhost/api/uploader/logout", { method: "POST" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true }));
    expect(clearUploaderCookieMock).toHaveBeenCalledTimes(1);
    expect(clearUploaderCookieMock).toHaveBeenCalledWith(expect.objectContaining({ status: 200 }));
  });
});
