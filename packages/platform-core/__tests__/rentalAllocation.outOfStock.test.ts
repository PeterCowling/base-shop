import type { SKU } from "@acme/types";

import type { InventoryItem } from "../src/types/inventory";

jest.mock("../src/repositories/inventory.server", () => ({
  updateInventoryItem: jest.fn(),
}));

describe("reserveRentalInventory - out of stock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when all items are out of stock", async () => {
    const { reserveRentalInventory } = await import("../src/orders/rentalAllocation");
    const repo = await import("../src/repositories/inventory.server");
    const mockUpdate = repo.updateInventoryItem as jest.Mock;

    const items: InventoryItem[] = [
      {
        sku: "s1",
        productId: "p1",
        quantity: 0,
        variantAttributes: {},
        wearCount: 0,
      },
    ];

    const sku: SKU = {
      id: "sku-4",
      slug: "slug-4",
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

    const result = await reserveRentalInventory(
      "shop",
      items,
      sku,
      "2024-05-11",
      "2024-05-12",
    );

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

