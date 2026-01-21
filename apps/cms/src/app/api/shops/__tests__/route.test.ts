const listShopSummaries = jest.fn();

jest.mock("../../../../lib/listShops", () => ({ listShopSummaries }));

jest.mock("@acme/lib/logger", () => ({
  logger: { error: jest.fn() },
}));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET", () => {
  it("returns list of shops", async () => {
    listShopSummaries.mockResolvedValue([{ id: "s1", name: "s1" }]);
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([{ id: "s1", name: "s1" }]);
  });

  it("logs error and returns 500 when listShops fails", async () => {
    const err = new Error("fail");
    listShopSummaries.mockRejectedValue(err);
    const { logger } = await import("@acme/lib/logger");
    const res = await GET();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "fail" });
    expect(logger.error).toHaveBeenCalledWith("[api/shops:GET] error", { error: err });
  });
});

export {};
