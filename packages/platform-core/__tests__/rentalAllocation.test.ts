import type { SKU } from "@acme/types";
import type { InventoryItem } from "../src/types/inventory";

jest.mock("../src/repositories/inventory.server", () => ({
  updateInventoryItem: jest.fn(),
}));

describe("reserveRentalInventory", () => {
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

  it("decrements quantity and increments wearCount on successful reservation", async () => {
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
      id: "sku-3",
      slug: "slug-3",
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

    mockUpdate.mockImplementation(async (_shop, _sku, _attrs, mutate) => {
      return mutate(candidate);
    });

    const result = await reserveRentalInventory(
      "shop",
      items,
      sku,
      "2024-05-11",
      "2024-05-12"
    );

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ...candidate,
      quantity: 1,
      wearCount: 2,
    });
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
