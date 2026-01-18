/** @jest-environment node */

import { NextRequest } from "next/server";

const SHOP_URL = "http://localhost/api/edit-changes?shop=test";

afterEach(() => {
  jest.resetModules();
});

describe("GET /api/edit-changes RBAC", () => {
  it("returns 401 for roles without manage_pages", async () => {
    jest.doMock("@acme/auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockRejectedValue(new Error("Unauthorized")),
    }));
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      __esModule: true,
      diffHistory: jest.fn(),
    }));
    const { GET } = await import("../route");
    const req = new NextRequest(SHOP_URL);
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with components for authorized roles", async () => {
    jest.doMock("@acme/auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockResolvedValue({ customerId: "c1", role: "ShopAdmin" }),
    }));
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      __esModule: true,
      diffHistory: jest.fn().mockResolvedValue([
        { diff: { pages: { p1: { components: [{ name: "Hero" }, "Banner"] } } } },
      ]),
    }));
    const { GET } = await import("../route");
    const req = new NextRequest(SHOP_URL);
    const res = await GET(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      components: [
        { pageId: "p1", name: "Banner" },
        { pageId: "p1", name: "Hero" },
      ],
    });
  });
});
