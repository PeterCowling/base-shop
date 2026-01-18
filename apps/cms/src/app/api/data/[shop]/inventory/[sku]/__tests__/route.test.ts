import { NextRequest } from "next/server";
import { __setMockSession } from "next-auth";
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const update = jest.fn();
jest.mock("@acme/platform-core/repositories/inventory.server", () => ({
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
    __setMockSession(null as any);
    const res = await PATCH(req({}), {
      params: Promise.resolve({ shop: "s1", sku: "sku1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid payload", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const res = await PATCH(req({ quantity: "oops" }), {
      params: Promise.resolve({ shop: "s1", sku: "sku1" }),
    });
    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 404 when item not found", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    update.mockRejectedValue(new Error("Not found"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await PATCH(req({ quantity: 1, variantAttributes: {} }), {
      params: Promise.resolve({ shop: "s1", sku: "sku1" }),
    });
    spy.mockRestore();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  it("returns updated item on success", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
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

  it("returns 503 when backend delegate is unavailable", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    update.mockRejectedValue(
      new Error("Prisma inventory delegate is unavailable"),
    );
    const res = await PATCH(req({ quantity: 1, variantAttributes: {} }), {
      params: Promise.resolve({ shop: "s1", sku: "sku1" }),
    });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Prisma inventory delegate is unavailable",
    });
  });
});
