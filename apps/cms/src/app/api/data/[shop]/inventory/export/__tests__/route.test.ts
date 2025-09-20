import { NextRequest } from "next/server";
import { __setMockSession } from "next-auth";
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const read = jest.fn();
jest.mock("@platform-core/repositories/inventory.server", () => ({
  inventoryRepository: { read },
}));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req(url: string) {
  return new NextRequest(url);
}

describe("GET", () => {
  it.each([null, { user: { role: "user" } }])(
    "returns 403 for session %p",
    async (session) => {
      __setMockSession(session as any);
      const res = await GET(req("http://test.local"), {
        params: Promise.resolve({ shop: "s1" }),
      });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Forbidden" });
    },
  );

  it("exports CSV when format=csv", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const items = [
      {
        sku: "sku1",
        productId: "p1",
        quantity: 5,
        variantAttributes: { color: "red", size: "M" },
      },
      {
        sku: "sku2",
        productId: "p2",
        quantity: 3,
        variantAttributes: { color: "blue", size: "S" },
      },
    ];
    read.mockResolvedValue(items);
    const res = await GET(req("http://test.local?format=csv"), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv");
    const lines = (await res.text()).trim().split("\n");
    expect(lines).toEqual([
      "sku,productId,variant.color,variant.size,quantity",
      "sku1,p1,red,M,5",
      "sku2,p2,blue,S,3",
    ]);
  });

  it("exports JSON by default", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const items = [
      {
        sku: "sku1",
        productId: "p1",
        quantity: 5,
        variantAttributes: { color: "red", size: "M" },
      },
      {
        sku: "sku2",
        productId: "p2",
        quantity: 3,
        variantAttributes: { color: "blue", size: "S" },
      },
    ];
    read.mockResolvedValue(items);
    const res = await GET(req("http://test.local"), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([
      {
        sku: "sku1",
        productId: "p1",
        "variant.color": "red",
        "variant.size": "M",
        quantity: 5,
      },
      {
        sku: "sku2",
        productId: "p2",
        "variant.color": "blue",
        "variant.size": "S",
        quantity: 3,
      },
    ]);
  });

  it("returns 400 when repository errors", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    read.mockRejectedValue(new Error("oops"));
    const res = await GET(req("http://test.local"), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "oops" });
  });
});
