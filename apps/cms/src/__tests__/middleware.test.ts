import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { getToken } from "next-auth/jwt";
import { canRead, canWrite } from "@auth/rbac";

jest.mock("../auth/secret", () => ({ authSecret: "test-secret" }));
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("@auth/rbac", () => ({ canRead: jest.fn(), canWrite: jest.fn() }));

const getTokenMock = getToken as jest.MockedFunction<typeof getToken>;
const canReadMock = canRead as jest.MockedFunction<typeof canRead>;
const canWriteMock = canWrite as jest.MockedFunction<typeof canWrite>;

describe("middleware", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    "/api/auth/test",
    "/login",
    "/signup",
    "/favicon.ico",
  ])("returns NextResponse.next for %s", async (path) => {
    getTokenMock.mockResolvedValue(null);

    const req = new NextRequest(`http://example.com${path}`);
    const res = await middleware(req);

    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects unauthenticated requests to /login with callbackUrl", async () => {
    getTokenMock.mockResolvedValue(null);

    const req = new NextRequest("http://example.com/cms");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://example.com/login?callbackUrl=%2Fcms",
    );
  });

  it("allows non-CMS paths without invoking canRead", async () => {
    getTokenMock.mockResolvedValue({ role: "viewer" } as any);

    const req = new NextRequest("http://example.com/other");
    const res = await middleware(req);

    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(canReadMock).not.toHaveBeenCalled();
  });

  it.each(["/_next/static/chunk.js", "/_next"])(
    "returns NextResponse.next for static asset path %s",
    async (path) => {
      getTokenMock.mockResolvedValue(null);

      const req = new NextRequest(`http://example.com${path}`);
      const res = await middleware(req);

      expect(res.headers.get("x-middleware-next")).toBe("1");
      expect(canReadMock).not.toHaveBeenCalled();
      expect(canWriteMock).not.toHaveBeenCalled();
    },
  );

  it("rewrites roles without read access to /403", async () => {
    getTokenMock.mockResolvedValue({ role: "viewer" } as any);
    canReadMock.mockReturnValue(false);

    const req = new NextRequest("http://example.com/cms");
    const res = await middleware(req);

    expect(res.status).toBe(403);
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://example.com/403");
  });

  it("blocks viewer roles from write routes", async () => {
    getTokenMock.mockResolvedValue({ role: "viewer" } as any);
    canReadMock.mockReturnValue(true);
    canWriteMock.mockReturnValue(false);

    const req = new NextRequest(
      "http://example.com/cms/shop/test-shop/products/1/edit",
    );
    const res = await middleware(req);

    expect(res.status).toBe(403);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://example.com/403?shop=test-shop",
    );
  });

  it("blocks viewer roles from media routes", async () => {
    getTokenMock.mockResolvedValue({ role: "viewer" } as any);
    canReadMock.mockReturnValue(true);
    canWriteMock.mockReturnValue(false);

    const req = new NextRequest(
      "http://example.com/cms/shop/foo/media/images",
    );
    const res = await middleware(req);

    expect(res.status).toBe(403);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://example.com/403?shop=foo",
    );
  });

  it("allows viewer roles with read access on CMS routes", async () => {
    getTokenMock.mockResolvedValue({ role: "viewer" } as any);
    canReadMock.mockReturnValue(true);
    canWriteMock.mockReturnValue(false);

    const req = new NextRequest("http://example.com/cms");
    const res = await middleware(req);

    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(canReadMock).toHaveBeenCalledWith("viewer");
    expect(canWriteMock).toHaveBeenCalledWith("viewer");
  });

  it("allows viewer roles on media when canWrite is true", async () => {
    getTokenMock.mockResolvedValue({ role: "viewer" } as any);
    canReadMock.mockReturnValue(true);
    canWriteMock.mockReturnValue(true);

    const req = new NextRequest("http://example.com/cms/shop/foo/media");
    const res = await middleware(req);

    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(canReadMock).toHaveBeenCalledWith("viewer");
    expect(canWriteMock).toHaveBeenCalledWith("viewer");
  });

  it("allows admin roles on write routes", async () => {
    getTokenMock.mockResolvedValue({ role: "admin" } as any);
    canReadMock.mockReturnValue(true);
    canWriteMock.mockReturnValue(true);

    const req = new NextRequest(
      "http://example.com/cms/shop/test-shop/products/1/edit",
    );
    const res = await middleware(req);

    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(canReadMock).toHaveBeenCalledWith("admin");
    expect(canWriteMock).toHaveBeenCalledWith("admin");
  });

  it("rejects mutating api requests with invalid csrf token", async () => {
    const req = new NextRequest("http://example.com/api/test", {
      method: "POST",
      headers: { "x-csrf-token": "bad" },
    });
    const res = await middleware(req);

    expect(res.status).toBe(403);
  });

  it("rejects mutating api requests with csrf cookie but no header", async () => {
    const req = new NextRequest("http://example.com/api/test", {
      method: "POST",
      headers: { cookie: "csrf_token=token" },
    });
    const res = await middleware(req);

    expect(res.status).toBe(403);
  });

  it("rejects mutating api requests with csrf header but no cookie", async () => {
    const req = new NextRequest("http://example.com/api/test", {
      method: "POST",
      headers: { "x-csrf-token": "token" },
    });
    const res = await middleware(req);

    expect(res.status).toBe(403);
  });

  it("allows repeated login attempts without rate limiting", async () => {
    const headers = {
      "x-forwarded-for": "1.2.3.4",
      "x-csrf-token": "token",
    } as Record<string, string>;

    for (let i = 0; i < 6; i++) {
      const res = await middleware(
        new NextRequest("http://example.com/api/auth/signin", {
          method: "POST",
          headers,
        }),
      );
      expect(res.status).toBe(200);
    }
  });
});

