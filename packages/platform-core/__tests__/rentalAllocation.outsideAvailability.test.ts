import type { SKU } from "@acme/types";
import type { InventoryItem } from "../src/types/inventory";

jest.mock("../src/repositories/inventory.server", () => ({
  updateInventoryItem: jest.fn(),
}));

describe("reserveRentalInventory - outside availability window", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when outside availability window", async () => {
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
        wearCount: 0,
      },
    ];

    const sku: SKU = {
      id: "sku-1",
      slug: "slug-1",
      title: "Test SKU",
      price: 0,
      deposit: 0,
      stock: 1,
      forSale: false,
      forRental: true,
      media: [],
      sizes: [],
      description: "",
      availability: [{ from: "2024-05-10", to: "2024-05-20" }],
    };

    const result = await reserveRentalInventory(
      "shop",
      items,
      sku,
      "2024-05-01",
      "2024-05-02"
    );
    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

