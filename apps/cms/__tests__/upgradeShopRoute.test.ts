
// Polyfill Response.json if missing
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
}

jest.mock("@auth", () => ({
  requirePermission: jest.fn(),
}));

jest.mock("child_process", () => ({
  spawnSync: jest.fn(),
}));

describe("upgrade-shop API route", () => {
  let requirePermission: jest.Mock;
  let spawnSync: jest.Mock;
  let chdirSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    ({ requirePermission } = require("@auth"));
    ({ spawnSync } = require("child_process"));
    spawnSync.mockReset();
    requirePermission.mockReset();
    chdirSpy = jest.spyOn(process, "chdir").mockImplementation((_path: string) => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    chdirSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("returns 200 and runs upgrade when authorized", async () => {
    requirePermission.mockResolvedValueOnce(undefined);
    spawnSync.mockReturnValueOnce({ status: 0 });

    const route = await import("../src/app/api/upgrade-shop/route");

    const req = { json: async () => ({ shop: "shop-1" }) } as any;
    const res = await route.POST(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
    expect(spawnSync).toHaveBeenCalledWith("pnpm", ["tsx", "scripts/src/upgrade-shop.ts", "shop-1"]);
  });

  it("returns 401 when permission check fails", async () => {
    requirePermission.mockRejectedValueOnce(new Error("nope"));
    const route = await import("../src/app/api/upgrade-shop/route");
    const req = { json: async () => ({ shop: "shop-1" }) } as any;
    const res = await route.POST(req);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("returns 400 when shop is missing", async () => {
    requirePermission.mockResolvedValueOnce(undefined);
    const route = await import("../src/app/api/upgrade-shop/route");
    const req = { json: async () => ({}) } as any;
    const res = await route.POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "shop required" });
  });

  it("returns 500 when upgrade fails", async () => {
    requirePermission.mockResolvedValueOnce(undefined);
    spawnSync.mockReturnValueOnce({ status: 1 });
    const route = await import("../src/app/api/upgrade-shop/route");
    const req = { json: async () => ({ shop: "shop-1" }) } as any;
    const res = await route.POST(req);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Upgrade failed" });
  });
});

