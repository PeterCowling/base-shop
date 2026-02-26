import { PATCH } from "@/app/admin/api/inventory/[sku]/route";

const EXISTING_ITEM = {
  sku: "caryina-silver",
  productId: "01JTEST000000000000000001",
  quantity: 5,
  variantAttributes: { color: "silver" },
  lowStockThreshold: 1,
};

jest.mock("@acme/platform-core/repositories/inventory.server", () => ({
  updateInventoryItem: jest.fn(),
  readInventory: jest.fn(),
}));

const { updateInventoryItem } = jest.requireMock(
  "@acme/platform-core/repositories/inventory.server",
) as { updateInventoryItem: jest.Mock };

const makeParams = (sku: string) => ({ params: Promise.resolve({ sku }) });

describe("PATCH /admin/api/inventory/:sku", () => {
  afterEach(() => jest.clearAllMocks());

  it("TC-04: updates quantity and returns 200 with updated item", async () => {
    const updatedItem = { ...EXISTING_ITEM, quantity: 10 };
    updateInventoryItem.mockImplementation(
      (_shop: string, _sku: string, _attrs: Record<string, string>, mutate: (c: typeof EXISTING_ITEM) => typeof EXISTING_ITEM) =>
        Promise.resolve(mutate(EXISTING_ITEM)),
    );

    const req = new Request("http://localhost/admin/api/inventory/caryina-silver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 10, variantAttributes: { color: "silver" } }),
    });
    const res = await PATCH(req, makeParams("caryina-silver"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { quantity: number } };
    expect(body.ok).toBe(true);
    expect(body.data.quantity).toBe(10);
    expect(updateInventoryItem).toHaveBeenCalledWith(
      "caryina",
      "caryina-silver",
      { color: "silver" },
      expect.any(Function),
    );
  });

  it("returns 404 when inventory item does not exist (mutate returns undefined)", async () => {
    updateInventoryItem.mockImplementation(
      (_shop: string, _sku: string, _attrs: Record<string, string>, mutate: (c: undefined) => undefined) =>
        Promise.resolve(mutate(undefined)),
    );

    const req = new Request("http://localhost/admin/api/inventory/nonexistent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 5 }),
    });
    const res = await PATCH(req, makeParams("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 400 for validation error (negative quantity)", async () => {
    const req = new Request("http://localhost/admin/api/inventory/caryina-silver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: -1 }),
    });
    const res = await PATCH(req, makeParams("caryina-silver"));
    expect(res.status).toBe(400);
    expect(updateInventoryItem).not.toHaveBeenCalled();
  });
});
