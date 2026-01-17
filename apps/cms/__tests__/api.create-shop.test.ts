import { jest } from "@jest/globals";
import { jsonRequest } from "@acme/test-utils";

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("create-shop API", () => {
  it("creates shop when authorized", async () => {
    const prevEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";
    const deployment = { status: "success", previewUrl: "https://new.pages.dev" };
    const createNewShop = jest.fn().mockResolvedValue(deployment);
    jest.doMock("@acme/platform-core/createShop", () => ({
      __esModule: true,
      createShopOptionsSchema: {
        extend: () => ({
          safeParse: (body: any) => ({
            success: true,
            data: {
              id: body.id,
              checkoutPage: [],
              navItems: [],
              pages: [],
              payment: [],
              shipping: [],
            },
          }),
        }),
      },
    }));
    jest.doMock("@cms/actions/createShop.server", () => ({
      __esModule: true,
      createNewShop,
    }));

    const { POST } = await import("../src/app/api/create-shop/route");
    const res = await POST(jsonRequest({ id: "new" }));
    expect(res.status).toBe(201);
    expect(createNewShop).toHaveBeenCalledTimes(1);
    expect(createNewShop).toHaveBeenCalledWith("new", {
      checkoutPage: [],
      navItems: [],
      pages: [],
      payment: [],
      shipping: [],
    });
    await expect(res.json()).resolves.toEqual({ success: true, deployment });
    (process.env as Record<string, string>).NODE_ENV = prevEnv as string;
  });

  it("returns 403 when unauthorized", async () => {
    const prevEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";
    const createNewShop = jest
      .fn()
      .mockRejectedValue(new Error("Forbidden"));
    jest.doMock("@acme/platform-core/createShop", () => ({
      __esModule: true,
      createShopOptionsSchema: {
        extend: () => ({
          safeParse: (body: any) => ({ success: true, data: body }),
        }),
      },
    }));
    jest.doMock("@cms/actions/createShop.server", () => ({
      __esModule: true,
      createNewShop,
    }));
    const { POST } = await import("../src/app/api/create-shop/route");
    const res = await POST(jsonRequest({ id: "new" }));
    expect(res.status).toBe(403);
    (process.env as Record<string, string>).NODE_ENV = prevEnv as string;
  });

  it("returns 400 when role assignment fails", async () => {
    const prevEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";
    const createNewShop = jest
      .fn()
      .mockRejectedValue(new Error("Failed to assign ShopAdmin role"));
    jest.doMock("@acme/platform-core/createShop", () => ({
      __esModule: true,
      createShopOptionsSchema: {
        extend: () => ({
          safeParse: (body: any) => ({ success: true, data: body }),
        }),
      },
    }));
    jest.doMock("@cms/actions/createShop.server", () => ({
      __esModule: true,
      createNewShop,
    }));
    const { POST } = await import("../src/app/api/create-shop/route");
    const res = await POST(jsonRequest({ id: "new" }));
    expect(res.status).toBe(400);
    (process.env as Record<string, string>).NODE_ENV = prevEnv as string;
  });
});

// Response.json() provided by shared test setup

afterEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("publish-locations API", () => {
  it("returns parsed locations", async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";
    jest.doMock("node:fs", () => ({
      promises: { readFile: jest.fn(() => Promise.resolve('[{"id":"1"}]')) },
    }));

    const { GET } = await import("../src/app/api/publish-locations/route");
    const res = await GET();
    const json = await res.json();
    expect(json).toEqual([{ id: "1" }]);
    (process.env as Record<string, string>).NODE_ENV = prev as string;
  });

  it("returns error when read fails", async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";
    jest.doMock("node:fs", () => ({
      promises: { readFile: jest.fn(() => Promise.reject(new Error("fail"))) },
    }));

    const { GET } = await import("../src/app/api/publish-locations/route");
    const res = await GET();
    const json = await res.json();
    expect(json).toEqual({ error: expect.any(String) });
    expect(res.status).toBe(404);
    (process.env as Record<string, string>).NODE_ENV = prev as string;
  });
});
