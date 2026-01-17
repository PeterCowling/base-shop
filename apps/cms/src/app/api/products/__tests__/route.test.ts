import { NextRequest } from "next/server";

const readRepo = jest.fn();
const readInventory = jest.fn();

jest.mock("@acme/platform-core/repositories/json.server", () => ({
  readRepo: (shop: string) => readRepo(shop),
  readInventory: (shop: string) => readInventory(shop),
}));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req(path: string) {
  return new NextRequest(`http://test.local/api/products${path}`);
}

describe("GET", () => {
  it("filters products by query", async () => {
    readRepo.mockResolvedValue([
      {
        id: "p1",
        sku: "p1",
        title: { en: "Red Shirt" },
        price: 10,
        media: [],
        availability: [],
      },
      {
        id: "p2",
        sku: "p2",
        title: { en: "Blue Pants" },
        price: 20,
        media: [],
        availability: [],
      },
    ]);
    readInventory.mockResolvedValue([
      { productId: "p1", quantity: 3 },
      { productId: "p2", quantity: 1 },
    ]);

    const res = await GET(req("?q=red"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ slug: "p1", title: "Red Shirt", stock: 3 });
  });

  it("returns 400 for invalid search params", async () => {
    const res = await GET(req("?foo=bar"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid search parameters" });
    expect(readRepo).not.toHaveBeenCalled();
    expect(readInventory).not.toHaveBeenCalled();
  });

  it("returns empty array when no products match", async () => {
    readRepo.mockResolvedValue([
      {
        id: "p1",
        sku: "p1",
        title: { en: "Red Shirt" },
        price: 10,
        media: [],
        availability: [],
      },
    ]);
    readInventory.mockResolvedValue([{ productId: "p1", quantity: 3 }]);

    const res = await GET(req("?q=green"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
