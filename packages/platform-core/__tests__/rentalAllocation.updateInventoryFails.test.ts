import type { SKU } from "@acme/types";

import type { InventoryItem } from "../src/types/inventory";

jest.mock("../src/repositories/inventory.server", () => ({
  updateInventoryItem: jest.fn(),
}));

describe("reserveRentalInventory - update failure", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when updateInventoryItem fails to update", async () => {
    const { reserveRentalInventory } = await import(
      "../src/orders/rentalAllocation"
    );
    const repo = await import("../src/repositories/inventory.server");
    const mockUpdate = repo.updateInventoryItem as jest.Mock;

    const candidate: InventoryItem = {
      sku: "s1",
      productId: "p1",
      quantity: 1,
      variantAttributes: {},
      wearCount: 0,
    };

    const items: InventoryItem[] = [candidate];

    const sku: SKU = {
      id: "sku-update-null",
      slug: "slug-update-null",
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

    mockUpdate.mockResolvedValue(null);

    const result = await reserveRentalInventory(
      "shop",
      items,
      sku,
      "2024-05-11",
      "2024-05-12",
    );

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });
});

