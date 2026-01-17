import { NextRequest } from "next/server";

const ensureAuthorized = jest.fn();
const getShopById = jest.fn();
const getSanityConfig = jest.fn();

jest.mock("@cms/actions/common/auth", () => ({
  __esModule: true,
  ensureAuthorized: (...args: any[]) => ensureAuthorized(...args),
}));

jest.mock("@acme/platform-core/repositories/shop.server", () => ({
  __esModule: true,
  getShopById: (...args: any[]) => getShopById(...args),
}));

jest.mock("@acme/platform-core/shops", () => ({
  __esModule: true,
  getSanityConfig: (...args: any[]) => getSanityConfig(...args),
}));

jest.mock("@acme/config/env/cms", () => ({
  __esModule: true,
  cmsEnv: {},
}));

let GET: typeof import("../route").GET;
const originalFetch = global.fetch;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

afterEach(() => {
  jest.resetAllMocks();
  global.fetch = originalFetch;
});

function req(url: string) {
  return new NextRequest(url);
}

describe("GET /api/blog/slug", () => {
  it("returns slug existence", async () => {
    ensureAuthorized.mockResolvedValue(undefined);
    getShopById.mockResolvedValue({});
    getSanityConfig.mockReturnValue({
      projectId: "p1",
      dataset: "d1",
      token: "t",
    });
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ result: { _id: "1" } }),
    }) as any;

    const res = await GET(req("http://test.local?slug=a&shopId=s1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ exists: true });
  });

  it("returns 400 when params missing", async () => {
    ensureAuthorized.mockResolvedValue(undefined);

    const res = await GET(req("http://test.local?slug=a"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing slug or shopId" });
  });

  it("throws for unauthorized access", async () => {
    ensureAuthorized.mockRejectedValue(new Error("Forbidden"));

    await expect(
      GET(req("http://test.local?slug=a&shopId=s1"))
    ).rejects.toThrow("Forbidden");
  });
});

