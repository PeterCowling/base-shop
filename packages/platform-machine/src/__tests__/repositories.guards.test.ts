/** @jest-environment node */
import { jest } from "@jest/globals";

// Inventory repository

describe.skip("inventoryRepository", () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.INVENTORY_BACKEND;
  });

  it("propagates backend errors", async () => {
    const read = jest.fn().mockRejectedValue(new Error("fail"));
    jest.doMock(
      "@acme/platform-core/repositories/inventory.json.server",
      () => ({ jsonInventoryRepository: { read } })
    );
    const { readInventory } = await import(
      "@acme/platform-core/repositories/inventory.server"
    );
    await expect(readInventory("shop1")).rejects.toThrow("fail");
  });
});

// Products repository

describe.skip("products repository", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("returns product when found", async () => {
    jest
      .spyOn(await import("fs"), "readFile")
      .mockResolvedValue(JSON.stringify([{ id: "p1", row_version: 1 }]) as any);
    const { getProductById } = await import(
      "@acme/platform-core/src/repositories/products.server"
    );
    const prod = await getProductById("shop", "p1");
    expect(prod?.id).toBe("p1");
  });

  it("returns null when product missing", async () => {
    jest
      .spyOn(await import("fs"), "readFile")
      .mockResolvedValue(JSON.stringify([]) as any);
    const { getProductById } = await import(
      "@acme/platform-core/src/repositories/products.server"
    );
    expect(await getProductById("shop", "x")).toBeNull();
  });

  it("validates shop name", async () => {
    jest.doMock("@acme/platform-core/src/shops/index", () => ({
      validateShopName: () => {
        throw new Error("bad shop");
      },
    }));
    const { getProductById } = await import(
      "@acme/platform-core/src/repositories/products.server"
    );
    await expect(getProductById("bad", "p1")).rejects.toThrow("bad shop");
  });
});

// Rental orders repository

describe.skip("rentalOrders repository", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("returns order on success", async () => {
    const update = jest.fn().mockResolvedValue({ id: 1 });
    jest.doMock("@acme/platform-core/src/db", () => ({
      prisma: { rentalOrder: { update } },
    }));
    const { markReceived } = await import(
      "@acme/platform-core/src/repositories/rentalOrders.server"
    );
    const res = await markReceived("shop", "s1");
    expect(update).toHaveBeenCalled();
    expect(res).toEqual({ id: 1 });
  });

  it("returns null on backend error", async () => {
    const update = jest.fn().mockRejectedValue(new Error("fail"));
    jest.doMock("@acme/platform-core/src/db", () => ({
      prisma: { rentalOrder: { update } },
    }));
    const { markReceived } = await import(
      "@acme/platform-core/src/repositories/rentalOrders.server"
    );
    await expect(markReceived("shop", "s1")).resolves.toBeNull();
  });
});

// Reverse logistics events repository

describe.skip("reverseLogisticsEvents repository", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("records events", async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    jest.doMock("@acme/platform-core/src/db", () => ({
      prisma: { reverseLogisticsEvent: { create } },
    }));
    const { recordEvent } = await import(
      "@acme/platform-core/src/repositories/reverseLogisticsEvents.server"
    );
    await recordEvent("shop", "s1", "received", "now");
    expect(create).toHaveBeenCalled();
  });

  it("propagates errors", async () => {
    const create = jest.fn().mockRejectedValue(new Error("fail"));
    jest.doMock("@acme/platform-core/src/db", () => ({
      prisma: { reverseLogisticsEvent: { create } },
    }));
    const { recordEvent } = await import(
      "@acme/platform-core/src/repositories/reverseLogisticsEvents.server"
    );
    await expect(recordEvent("shop", "s1", "received", "now")).rejects.toThrow(
      "fail"
    );
  });
});

// Settings repository

describe.skip("settings repository", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("falls back to defaults when file missing", async () => {
    jest
      .spyOn(await import("fs"), "readFile")
      .mockRejectedValue(new Error("missing"));
    const { getShopSettings } = await import(
      "@acme/platform-core/src/repositories/settings.server"
    );
    const res = await getShopSettings("shop");
    expect(res.languages).toBeDefined();
  });

  it("validates shop name", async () => {
    jest.doMock("@acme/platform-core/src/shops/index", () => ({
      validateShopName: () => {
        throw new Error("bad shop");
      },
    }));
    const { getShopSettings } = await import(
      "@acme/platform-core/src/repositories/settings.server"
    );
    await expect(getShopSettings("bad")).rejects.toThrow("bad shop");
  });
});

// Shop repository

describe.skip("shop repository", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("returns data from prisma when found", async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValue({ data: { id: "s", name: "S" } });
    jest.doMock("@acme/platform-core/src/db", () => ({
      prisma: { shop: { findUnique } },
    }));
    const { getShopById } = await import(
      "@acme/platform-core/src/repositories/shop.server"
    );
    const res = await getShopById("s");
    expect(findUnique).toHaveBeenCalled();
    expect(res.id).toBe("s");
  });

  it("throws when not found", async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    jest.doMock("@acme/platform-core/src/db", () => ({
      prisma: { shop: { findUnique } },
    }));
    jest.doMock("fs", () => ({
      promises: { readFile: jest.fn().mockRejectedValue(new Error("missing")) },
    }));
    const { getShopById } = await import(
      "@acme/platform-core/src/repositories/shop.server"
    );
    await expect(getShopById("unknown")).rejects.toThrow(
      "Shop unknown not found"
    );
  });

  it("validates shop name", async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    jest.doMock("@acme/platform-core/src/db", () => ({
      prisma: { shop: { findUnique } },
    }));
    jest.doMock("@acme/platform-core/src/shops/index", () => ({
      validateShopName: () => {
        throw new Error("invalid");
      },
    }));
    const { getShopById } = await import(
      "@acme/platform-core/src/repositories/shop.server"
    );
    await expect(getShopById("bad")).rejects.toThrow("invalid");
  });
});
