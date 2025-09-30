import type { SKU } from "@acme/types";
import type { InventoryItem } from "../src/types/inventory";

jest.mock("../src/repositories/inventory.server", () => ({
  updateInventoryItem: jest.fn(),
}));

describe("reserveRentalInventory - infinite maintenance cycle allows selection", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("selects items even when wearCount hits a finite cycle if maintenance cycle is infinite", async () => {
    const { reserveRentalInventory } = await import("../src/orders/rentalAllocation");
    const repo = await import("../src/repositories/inventory.server");
    const mockUpdate = repo.updateInventoryItem as jest.Mock;

    const candidate: InventoryItem = {
      sku: "s1",
      productId: "p1",
      quantity: 1,
      variantAttributes: {},
      wearCount: 6,
    };

    const items: InventoryItem[] = [candidate];

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
      wearAndTearLimit: 10,
      maintenanceCycle: Infinity,
    };

    mockUpdate.mockImplementation(async (_shop, _sku, _attrs, mutate) => {
      return mutate(candidate);
    });

    const result = await reserveRentalInventory(
      "shop",
      items,
      sku,
      "2024-05-11",
      "2024-05-12",
    );

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ...candidate,
      quantity: 0,
      wearCount: 7,
    });
  });
});

