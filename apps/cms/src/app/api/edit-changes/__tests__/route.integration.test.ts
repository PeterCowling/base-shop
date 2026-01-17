/** @jest-environment node */

import { NextRequest } from "next/server";
import type { Role } from "@acme/auth/types/roles";
import { nextHeadersMock } from "../../../../../__tests__/mocks/external";

const SHOP_URL = "http://localhost/api/edit-changes?shop=test";

async function createSessionCookie(role: Role): Promise<string> {
  const { createCustomerSession, CUSTOMER_SESSION_COOKIE } = await import("@auth");
  const store = { get: jest.fn(), set: jest.fn(), delete: jest.fn() };
  nextHeadersMock.cookies.mockReturnValue(store);
  await createCustomerSession({ customerId: "c1", role });
  const token = store.set.mock.calls.find(([name]) => name === CUSTOMER_SESSION_COOKIE)?.[1];
  store.get.mockReturnValue({ value: token });
  return `${CUSTOMER_SESSION_COOKIE}=${token}`;
}

afterEach(() => {
  jest.resetModules();
  nextHeadersMock.cookies.mockReset();
});

describe("GET /api/edit-changes RBAC", () => {
  it("returns 401 for roles without manage_pages", async () => {
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      __esModule: true,
      diffHistory: jest.fn(),
    }));
    const { GET } = await import("../route");
    for (const role of ["customer", "viewer"] as Role[]) {
      const cookie = await createSessionCookie(role);
      const req = new NextRequest(SHOP_URL, { headers: { cookie } });
      const res = await GET(req);
      expect(res.status).toBe(401);
    }
  });

  it("returns 200 with components for authorized roles", async () => {
    const { ROLE_PERMISSIONS } = await import("@acme/auth/permissions");
    const original = [...(ROLE_PERMISSIONS.ShopAdmin || [])];
    ROLE_PERMISSIONS.ShopAdmin = [...original, "manage_pages"];
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      __esModule: true,
      diffHistory: jest.fn().mockResolvedValue([
        { diff: { pages: { p1: { components: [{ name: "Hero" }, "Banner"] } } } },
      ]),
    }));
    const { GET } = await import("../route");
    const cookie = await createSessionCookie("ShopAdmin");
    const req = new NextRequest(SHOP_URL, { headers: { cookie } });
    const res = await GET(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      components: [
        { pageId: "p1", name: "Banner" },
        { pageId: "p1", name: "Hero" },
      ],
    });
    ROLE_PERMISSIONS.ShopAdmin = original;
  });
});

