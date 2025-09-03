import { NextRequest } from "next/server";

const getServerSession = jest.fn();
jest.mock("next-auth", () => ({ getServerSession }));
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const update = jest.fn();
jest.mock("@platform-core/repositories/inventory.server", () => ({
  inventoryRepository: { update },
}));

let PATCH: typeof import("../route").PATCH;

beforeAll(async () => {
  ({ PATCH } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req(body: unknown) {
  return new NextRequest("http://test.local", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH", () => {
  it("returns 403 without session", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await PATCH(req({}), {
      params: Promise.resolve({ shop: "s1", sku: "sku1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid payload", async () => {
    getServerSession.mockResolvedValue({ user: { role: "admin" } });
    const res = await PATCH(req({ quantity: "oops" }), {
      params: Promise.resolve({ shop: "s1", sku: "sku1" }),
    });
    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 404 when item not found", async () => {
    getServerSession.mockResolvedValue({ user: { role: "admin" } });
    update.mockRejectedValue(new Error("Not found"));
    const res = await PATCH(req({ quantity: 1, variantAttributes: {} }), {
      params: Promise.resolve({ shop: "s1", sku: "sku1" }),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  it("returns updated item on success", async () => {
    getServerSession.mockResolvedValue({ user: { role: "admin" } });
    const updated = {
      sku: "sku1",
      productId: "p1",
      quantity: 5,
      variantAttributes: {},
    };
    update.mockResolvedValue(updated);
    const res = await PATCH(req({ quantity: 5 }), {
      params: Promise.resolve({ shop: "s1", sku: "sku1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(update).toHaveBeenCalledWith("s1", "sku1", {}, expect.any(Function));
  });
});
