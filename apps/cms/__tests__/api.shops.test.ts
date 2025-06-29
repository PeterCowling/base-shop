import { jest } from "@jest/globals";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: any, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("shops API", () => {
  it("returns list from listShops", async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";
    jest.doMock("../src/app/cms/listShops", () => ({
      __esModule: true,
      listShops: jest
        .fn<Promise<string[]>, []>()
        .mockResolvedValue(["shop-a", "shop-b"]),
    }));

    const { GET } = await import("../src/app/api/shops/route");
    const res = await GET();
    const json = await res.json();
    expect(json).toEqual(["shop-a", "shop-b"]);
    (process.env as Record<string, string>).NODE_ENV = prev as string;
  });
});
