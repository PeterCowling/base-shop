import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const hasUploaderSessionMock = jest.fn();
const isUploaderIpAllowedByHeadersMock = jest.fn();

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/accessControl", () => ({
  isUploaderIpAllowedByHeaders: (...args: unknown[]) => isUploaderIpAllowedByHeadersMock(...args),
  uploaderAccessDeniedJsonResponse: () => new Response(JSON.stringify({ ok: false }), { status: 404 }),
}));

describe("uploader session route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isUploaderIpAllowedByHeadersMock.mockReturnValue(true);
  });

  it("returns 404 when request IP is not allowlisted", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(false);
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/uploader/session"));
    expect(response.status).toBe(404);
    expect(hasUploaderSessionMock).not.toHaveBeenCalled();
  });

  it("returns authenticated false when no session exists", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/uploader/session"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true, authenticated: false }));
  });

  it("returns authenticated true when session exists", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(true);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/uploader/session"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true, authenticated: true }));
  });
});
