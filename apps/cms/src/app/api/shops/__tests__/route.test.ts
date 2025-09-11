const listShops = jest.fn();

jest.mock("../../../../lib/listShops", () => ({ listShops }));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET", () => {
  it("returns list of shops", async () => {
    listShops.mockResolvedValue([{ id: "s1" }]);
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([{ id: "s1" }]);
  });

  it("logs error and returns 500 when listShops fails", async () => {
    const err = new Error("fail");
    listShops.mockRejectedValue(err);
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await GET();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "fail" });
    expect(spy).toHaveBeenCalledWith("[api/shops:GET] error", err);
    spy.mockRestore();
  });
});
