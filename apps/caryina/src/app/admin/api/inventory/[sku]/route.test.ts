import { PATCH } from "@/app/admin/api/inventory/[sku]/route";

const PRODUCT = {
  id: "01JTEST000000000000000001",
  sku: "caryina-silver",
};

const EXISTING_ITEM = {
  sku: "caryina-silver",
  productId: PRODUCT.id,
  quantity: 5,
  variantAttributes: { color: "silver" },
  lowStockThreshold: 1,
};

jest.mock("@acme/platform-core/repositories/inventory.server", () => ({
  updateInventoryItem: jest.fn(),
  readInventory: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/products.server", () => ({
  readRepo: jest.fn(),
}));

const { updateInventoryItem } = jest.requireMock(
  "@acme/platform-core/repositories/inventory.server",
) as { updateInventoryItem: jest.Mock };

const { readRepo } = jest.requireMock(
  "@acme/platform-core/repositories/products.server",
) as { readRepo: jest.Mock };

const makeParams = (sku: string) => ({ params: Promise.resolve({ sku }) });

describe("PATCH /admin/api/inventory/:sku", () => {
  afterEach(() => jest.clearAllMocks());

  it("TC-01-03: updates quantity and returns 200 with updated item", async () => {
    readRepo.mockResolvedValue([PRODUCT]);
    updateInventoryItem.mockImplementation(
      (
        _shop: string,
        _sku: string,
        _attrs: Record<string, string>,
        mutate: (current: typeof EXISTING_ITEM | undefined) => typeof EXISTING_ITEM | undefined,
      ) => Promise.resolve(mutate(EXISTING_ITEM)),
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
    expect(readRepo).toHaveBeenCalledWith("caryina");
    expect(updateInventoryItem).toHaveBeenCalledWith(
      "caryina",
      "caryina-silver",
      { color: "silver" },
      expect.any(Function),
    );
  });

  it("TC-01-01: creates inventory item for existing SKU when row is missing", async () => {
    readRepo.mockResolvedValue([PRODUCT]);
    updateInventoryItem.mockImplementation(
      (
        _shop: string,
        _sku: string,
        _attrs: Record<string, string>,
        mutate: (current: undefined) => typeof EXISTING_ITEM | undefined,
      ) => Promise.resolve(mutate(undefined)),
    );

    const req = new Request("http://localhost/admin/api/inventory/caryina-silver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 3 }),
    });

    const res = await PATCH(req, makeParams("caryina-silver"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { quantity: number; productId: string; variantAttributes: Record<string, string> };
    };
    expect(body.ok).toBe(true);
    expect(body.data.quantity).toBe(3);
    expect(body.data.productId).toBe(PRODUCT.id);
    expect(body.data.variantAttributes).toEqual({});
    expect(updateInventoryItem).toHaveBeenCalledWith(
      "caryina",
      "caryina-silver",
      {},
      expect.any(Function),
    );
  });

  it("TC-01-02: returns 404 when SKU does not map to a product", async () => {
    readRepo.mockResolvedValue([]);
    updateInventoryItem.mockImplementation(
      (
        _shop: string,
        _sku: string,
        _attrs: Record<string, string>,
        mutate: (current: undefined) => undefined,
      ) => Promise.resolve(mutate(undefined)),
    );

    const req = new Request("http://localhost/admin/api/inventory/nonexistent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 5 }),
    });

    const res = await PATCH(req, makeParams("nonexistent"));

    expect(res.status).toBe(404);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe("not_found");
  });

  it("returns 400 for validation error (negative quantity)", async () => {
    const req = new Request("http://localhost/admin/api/inventory/caryina-silver", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: -1 }),
    });

    const res = await PATCH(req, makeParams("caryina-silver"));

    expect(res.status).toBe(400);
    expect(readRepo).not.toHaveBeenCalled();
    expect(updateInventoryItem).not.toHaveBeenCalled();
  });
});
