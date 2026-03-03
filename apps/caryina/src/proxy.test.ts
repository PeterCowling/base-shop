import { NextRequest } from "next/server";

import { verifyAdminSession } from "./lib/adminAuth";
import { proxy } from "./proxy";

jest.mock("./lib/adminAuth", () => ({
  ADMIN_COOKIE_NAME: "admin_session",
  verifyAdminSession: jest.fn(),
}));

const mockVerifyAdminSession = verifyAdminSession as jest.MockedFunction<typeof verifyAdminSession>;

function makeRequest(pathname: string, token?: string): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `admin_session=${token}`);
  }
  return new NextRequest(`http://localhost${pathname}`, { headers });
}

describe("proxy admin guard", () => {
  const originalKey = process.env.CARYINA_ADMIN_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalKey !== undefined) {
      process.env.CARYINA_ADMIN_KEY = originalKey;
    } else {
      delete process.env.CARYINA_ADMIN_KEY;
    }
  });

  it("allows public admin routes without auth checks", async () => {
    process.env.CARYINA_ADMIN_KEY = "test-admin-key";

    const response = await proxy(makeRequest("/admin/login"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(mockVerifyAdminSession).not.toHaveBeenCalled();
  });

  it("returns 500 when CARYINA_ADMIN_KEY is missing", async () => {
    delete process.env.CARYINA_ADMIN_KEY;

    const response = await proxy(makeRequest("/admin/products"));

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toContain("Server configuration error");
  });

  it("redirects to /admin/login when session cookie is missing", async () => {
    process.env.CARYINA_ADMIN_KEY = "test-admin-key";

    const response = await proxy(makeRequest("/admin/products"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/admin/login?redirect=%2Fadmin%2Fproducts",
    );
    expect(mockVerifyAdminSession).not.toHaveBeenCalled();
  });

  it("redirects to /admin/login when session token is invalid", async () => {
    process.env.CARYINA_ADMIN_KEY = "test-admin-key";
    mockVerifyAdminSession.mockResolvedValue(false);

    const response = await proxy(makeRequest("/admin/products", "bad-token"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/admin/login?redirect=%2Fadmin%2Fproducts",
    );
    expect(mockVerifyAdminSession).toHaveBeenCalledWith("bad-token", "test-admin-key");
  });

  it("allows request when session token is valid", async () => {
    process.env.CARYINA_ADMIN_KEY = "test-admin-key";
    mockVerifyAdminSession.mockResolvedValue(true);

    const response = await proxy(makeRequest("/admin/products", "good-token"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(mockVerifyAdminSession).toHaveBeenCalledWith("good-token", "test-admin-key");
  });
});
