import type { SKU } from "@acme/types";
import type { InventoryItem } from "../src/types/inventory";

jest.mock("../src/repositories/inventory.server", () => ({
  updateInventoryItem: jest.fn(),
}));

describe("reserveRentalInventory - disqualified by wear/maintenance", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when wear limit or maintenance cycle disqualifies all items", async () => {
    const { reserveRentalInventory } = await import(
      "../src/orders/rentalAllocation"
    );
    const repo = await import("../src/repositories/inventory.server");
    const mockUpdate = repo.updateInventoryItem as jest.Mock;

    const items: InventoryItem[] = [
      {
        sku: "s1",
        productId: "p1",
        quantity: 1,
        variantAttributes: {},
        wearCount: 5,
      },
      {
        sku: "s2",
        productId: "p2",
        quantity: 1,
        variantAttributes: {},
        wearCount: 3,
      },
    ];

    const sku: SKU = {
      id: "sku-2",
      slug: "slug-2",
      title: "Test SKU",
      price: 0,
      deposit: 0,
      stock: 1,
      forSale: false,
      forRental: true,
      media: [],
      sizes: [],
      description: "",
      wearAndTearLimit: 5,
      maintenanceCycle: 3,
    };

    const result = await reserveRentalInventory(
      "shop",
      items,
      sku,
      "2024-05-11",
      "2024-05-12"
    );

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

