import { NextRequest } from "next/server";

const getProductById = jest.fn();

jest.mock("@platform-core/repositories/json.server", () => ({
  getProductById: (shop: string, id: string) => getProductById(shop, id),
}));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req() {
  return new NextRequest("http://test.local");
}

describe("GET", () => {
  it("returns 400 for invalid params", async () => {
    const res = await GET(req(), {
      params: Promise.resolve({ shop: 123, id: "p1" } as any),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid params" });
    expect(getProductById).not.toHaveBeenCalled();
  });

  it("returns 404 when product not found", async () => {
    getProductById.mockResolvedValue(null);
    const res = await GET(req(), {
      params: Promise.resolve({ shop: "s1", id: "p1" }),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  it("returns product when found", async () => {
    const product = { id: "p1", title: "Test" };
    getProductById.mockResolvedValue(product);
    const res = await GET(req(), {
      params: Promise.resolve({ shop: "s1", id: "p1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(product);
  });
});
