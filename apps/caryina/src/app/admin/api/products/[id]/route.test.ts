import { DELETE, PATCH } from "@/app/admin/api/products/[id]/route";

const EXISTING_PRODUCT = {
  id: "01JTEST000000000000000001",
  sku: "charm-silver",
  title: { en: "Silver Charm", de: "Silver Charm", it: "Silver Charm" },
  description: { en: "A silver charm", de: "A silver charm", it: "A silver charm" },
  price: 2500,
  currency: "EUR",
  media: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  shop: "caryina",
  status: "active",
  row_version: 1,
  forSale: true,
  forRental: false,
};

jest.mock("@acme/platform-core/repositories/products.server", () => ({
  readRepo: jest.fn(),
  writeRepo: jest.fn(),
  getProductById: jest.fn(),
  updateProductInRepo: jest.fn(),
  deleteProductFromRepo: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/inventory.server", () => ({
  readInventory: jest.fn(),
}));

const { getProductById, updateProductInRepo, deleteProductFromRepo } = jest.requireMock(
  "@acme/platform-core/repositories/products.server",
) as {
  getProductById: jest.Mock;
  updateProductInRepo: jest.Mock;
  deleteProductFromRepo: jest.Mock;
};

const { readInventory } = jest.requireMock(
  "@acme/platform-core/repositories/inventory.server",
) as {
  readInventory: jest.Mock;
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("PATCH /admin/api/products/:id", () => {
  afterEach(() => jest.clearAllMocks());

  it("TC-02: updates price and returns 200 with updated record", async () => {
    const updated = { ...EXISTING_PRODUCT, price: 3000, row_version: 2 };
    getProductById.mockResolvedValue(EXISTING_PRODUCT);
    readInventory.mockResolvedValue([]);
    updateProductInRepo.mockResolvedValue(updated);

    const req = new Request("http://localhost/admin/api/products/01JTEST000000000000000001", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: 3000 }),
    });
    const res = await PATCH(req, makeParams("01JTEST000000000000000001"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { price: number } };
    expect(body.ok).toBe(true);
    expect(body.data.price).toBe(3000);
  });

  it("returns 400 when first activation is attempted without stock", async () => {
    getProductById.mockResolvedValue({ ...EXISTING_PRODUCT, status: "draft" });
    readInventory.mockResolvedValue([]);

    const req = new Request("http://localhost/admin/api/products/01JTEST000000000000000001", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });

    const res = await PATCH(req, makeParams("01JTEST000000000000000001"));

    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe("active_requires_stock");
    expect(updateProductInRepo).not.toHaveBeenCalled();
  });

  it("allows first activation when stock already exists", async () => {
    getProductById.mockResolvedValue({ ...EXISTING_PRODUCT, status: "draft" });
    readInventory.mockResolvedValue([
      {
        sku: EXISTING_PRODUCT.sku,
        productId: EXISTING_PRODUCT.id,
        quantity: 2,
        variantAttributes: {},
      },
    ]);
    updateProductInRepo.mockResolvedValue({ ...EXISTING_PRODUCT, row_version: 2 });

    const req = new Request("http://localhost/admin/api/products/01JTEST000000000000000001", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });

    const res = await PATCH(req, makeParams("01JTEST000000000000000001"));

    expect(res.status).toBe(200);
    expect(updateProductInRepo).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when product does not exist", async () => {
    getProductById.mockResolvedValue(null);
    const req = new Request("http://localhost/admin/api/products/nonexistent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: 1000 }),
    });
    const res = await PATCH(req, makeParams("nonexistent"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /admin/api/products/:id", () => {
  afterEach(() => jest.clearAllMocks());

  it("TC-03: deletes product and returns 204", async () => {
    deleteProductFromRepo.mockResolvedValue(undefined);
    const req = new Request("http://localhost/admin/api/products/01JTEST000000000000000001", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams("01JTEST000000000000000001"));
    expect(res.status).toBe(204);
    expect(deleteProductFromRepo).toHaveBeenCalledWith("caryina", "01JTEST000000000000000001");
  });

  it("returns 404 when product does not exist", async () => {
    deleteProductFromRepo.mockRejectedValue(new Error("Product nonexistent not found in caryina"));
    const req = new Request("http://localhost/admin/api/products/nonexistent", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams("nonexistent"));
    expect(res.status).toBe(404);
  });
});
