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

function expectSecurityHeaders(response: Response) {
  const csp = response.headers.get("Content-Security-Policy") ?? "";
  expect(csp).toContain("img-src 'self' data: blob: https:");
  expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  expect(response.headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
}

describe("uploader middleware", () => {
  it("denies non-allowlisted API requests with 404 JSON response", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(false);
    const { middleware } = await import("../middleware");
    const response = middleware(makeRequest("/api/uploader/session"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ ok: false });
    expectSecurityHeaders(response);
  });

  it("denies non-allowlisted page requests with 404 response", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(false);
    const { middleware } = await import("../middleware");
    const response = middleware(makeRequest("/"));
    expect(response.status).toBe(404);
    expectSecurityHeaders(response);
  });

  it("passes through allowlisted requests", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(true);
    const { middleware } = await import("../middleware");
    const response = middleware(makeRequest("/"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expectSecurityHeaders(response);
  });

  // C4 — Middleware malformed cookie handling

  it("C4: does not crash and denies API request when Cookie header contains malformed value", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(false);
    const { middleware } = await import("../middleware");
    const req = makeRequest("/api/uploader/session");
    req.headers.set("cookie", "xa_uploader_admin=!!!bad!!!%GG;=;truncated");
    const response = middleware(req);
    expect(response.status).toBe(404);
    expectSecurityHeaders(response);
  });

  it("C4: passes through allowlisted request even when Cookie header contains non-JSON session value", async () => {
    isUploaderIpAllowedByHeadersMock.mockReturnValueOnce(true);
    const { middleware } = await import("../middleware");
    const req = makeRequest("/api/uploader/catalog");
    req.headers.set("cookie", "xa_uploader_admin={not-json}; other=val");
    const response = middleware(req);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expectSecurityHeaders(response);
  });
});
