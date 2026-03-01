import { describe, expect, it, jest } from "@jest/globals";

const isUploaderIpAllowedByHeadersMock = jest.fn();

jest.mock("../lib/accessControl", () => ({
  isUploaderIpAllowedByHeaders: (...args: unknown[]) => isUploaderIpAllowedByHeadersMock(...args),
  uploaderAccessDeniedJsonResponse: () => new Response(JSON.stringify({ ok: false }), { status: 404 }),
}));

function makeRequest(pathname: string) {
  return {
    headers: new Headers(),
    nextUrl: new URL(`https://uploader.example${pathname}`),
  } as any;
}

describe("uploader middleware", () => {
  it("denies non-allowlisted API requests with 404 JSON response", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(false);
    const { middleware } = await import("../middleware");
    const response = middleware(makeRequest("/api/uploader/session"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it("denies non-allowlisted page requests with 404 response", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(false);
    const { middleware } = await import("../middleware");
    const response = middleware(makeRequest("/"));
    expect(response.status).toBe(404);
  });

  it("passes through allowlisted requests", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(true);
    const { middleware } = await import("../middleware");
    const response = middleware(makeRequest("/"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
