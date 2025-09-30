import type { SKU } from "@acme/types";
import type { InventoryItem } from "../src/types/inventory";

jest.mock("../src/repositories/inventory.server", () => ({
  updateInventoryItem: jest.fn(),
}));

describe("reserveRentalInventory - SKU without explicit availability", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("reserves inventory when SKU lacks availability", async () => {
    const { reserveRentalInventory } = await import(
      "../src/orders/rentalAllocation"
    );
    const repo = await import("../src/repositories/inventory.server");
    const mockUpdate = repo.updateInventoryItem as jest.Mock;

    const candidate: InventoryItem = {
      sku: "s1",
      productId: "p1",
      quantity: 2,
      variantAttributes: {},
      wearCount: 1,
    };

    const items: InventoryItem[] = [candidate];

    const sku: SKU = {
      id: "sku-availability",
      slug: "slug-availability",
      title: "Test SKU",
      price: 0,
      deposit: 0,
      stock: 1,
      forSale: false,
      forRental: true,
      media: [],
      sizes: [],
      description: "",
    };

    mockUpdate.mockImplementation(async (_shop, _sku, _attrs, mutate) => {
      return mutate(candidate);
    });

    const result = await reserveRentalInventory(
      "shop",
      items,
      sku,
      "2024-05-01",
      "2024-05-02"
    );

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ...candidate,
      quantity: 1,
      wearCount: 2,
    });
  });
});

