import { jest } from "@jest/globals";
import type { Session } from "next-auth";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: any, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("create-shop API", () => {
  it("creates shop when authorized", async () => {
    const prevEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";
    const deployResult = {
      status: "success",
      previewUrl: "https://new.pages.dev",
    };
    const createNewShop = jest.fn().mockResolvedValue(deployResult);
    const session: Session = {
      user: { role: "admin", email: "a" },
      expires: "",
    } as any;
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn(() => Promise.resolve(session)),
    }));
    jest.doMock("@cms/actions/createShop.server", () => ({
      __esModule: true,
      createNewShop,
    }));

    const { POST } = await import("../src/app/api/create-shop/route");
    const body = { id: "new" };
    const req = { json: () => Promise.resolve(body) } as Request;
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(createNewShop).toHaveBeenCalledTimes(1);
    expect(createNewShop).toHaveBeenCalledWith("new", {
      checkoutPage: [],
      navItems: [],
      pages: [],
      payment: [],
      shipping: [],
    });
    await expect(res.json()).resolves.toEqual({
      success: true,
      deployment: deployResult,
    });
    (process.env as Record<string, string>).NODE_ENV = prevEnv as string;
  });

  it("returns 403 when unauthorized", async () => {
    const prevEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn(() =>
        Promise.resolve({ user: { role: "viewer" } })
      ),
    }));
    const { POST } = await import("../src/app/api/create-shop/route");
    const res = await POST({ json: async () => ({}) } as Request);
    expect(res.status).toBe(403);
    (process.env as Record<string, string>).NODE_ENV = prevEnv as string;
  });
});

// polyfill Response.json for JSDOM
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: any, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
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
