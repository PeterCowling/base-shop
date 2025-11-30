import { jest } from "@jest/globals";

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("shops API", () => {
  it("returns list from listShops", async () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";
    jest.doMock("../src/lib/listShops", () => ({
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

  it("handles listShops error", async () => {
    jest.doMock("../src/lib/listShops", () => ({
      __esModule: true,
      listShops: jest.fn().mockRejectedValue(new Error("boom")),
    }));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { GET } = await import("../src/app/api/shops/route");
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toHaveProperty("error");
    spy.mockRestore();
  });
});
