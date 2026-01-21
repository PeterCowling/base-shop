/** @jest-environment node */

describe("releaseExpiredInventoryHoldsOnce", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("releases expired holds and restores inventory", async () => {
    const { prisma } = await import("@acme/platform-core/db");
    const { variantKey } = await import("@acme/platform-core/types/inventory");
    const { createInventoryHold } = await import("@acme/platform-core/inventoryHolds");
    const { releaseExpiredInventoryHoldsOnce } = await import("../releaseExpiredInventoryHoldsService");

    const shopId = "shop1";
    const sku = "sku_1";
    const key = variantKey(sku, {});
    await prisma.inventoryItem.createMany({
      data: [{ shopId, sku, variantKey: key, quantity: 2 }],
    });

    const now = new Date("2025-01-01T00:00:00.000Z");
    const hold = await createInventoryHold({
      shopId,
      holdId: "hold_1",
      requests: [{ sku, quantity: 1, variantAttributes: {} }],
      ttlMs: 1000,
      now,
    });
    expect(hold.ok).toBe(true);

    const itemAfterHold = await prisma.inventoryItem.findUnique({
      where: { shopId_sku_variantKey: { shopId, sku, variantKey: key } },
    });
    expect(itemAfterHold?.quantity).toBe(1);

    const res = await releaseExpiredInventoryHoldsOnce({
      now: new Date(now.getTime() + 2000),
    });
    expect(res.scanned).toBe(1);
    expect(res.released).toBe(1);

    const itemAfterRelease = await prisma.inventoryItem.findUnique({
      where: { shopId_sku_variantKey: { shopId, sku, variantKey: key } },
    });
    expect(itemAfterRelease?.quantity).toBe(2);

    const holdAfterRelease = await prisma.inventoryHold.findUnique({
      where: { shopId_holdId: { shopId, holdId: "hold_1" } },
    });
    expect(holdAfterRelease?.status).toBe("released");
  });

  it("does not release holds that have not expired", async () => {
    const { prisma } = await import("@acme/platform-core/db");
    const { variantKey } = await import("@acme/platform-core/types/inventory");
    const { createInventoryHold } = await import("@acme/platform-core/inventoryHolds");
    const { releaseExpiredInventoryHoldsOnce } = await import("../releaseExpiredInventoryHoldsService");

    const shopId = "shop2";
    const sku = "sku_2";
    const key = variantKey(sku, {});
    await prisma.inventoryItem.createMany({
      data: [{ shopId, sku, variantKey: key, quantity: 1 }],
    });

    const now = new Date("2025-01-01T00:00:00.000Z");
    await createInventoryHold({
      shopId,
      holdId: "hold_2",
      requests: [{ sku, quantity: 1, variantAttributes: {} }],
      ttlMs: 60_000,
      now,
    });

    const res = await releaseExpiredInventoryHoldsOnce({ now: new Date(now.getTime() + 1000) });
    expect(res.scanned).toBe(0);
    expect(res.released).toBe(0);
  });
});

describe("startExpiredInventoryHoldReleaseService", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("schedules periodic runs and supports cleanup", async () => {
    const releaseFn = jest.fn().mockResolvedValue({
      scanned: 0,
      released: 0,
      alreadyReleased: 0,
      skippedCommitted: 0,
      failed: 0,
    });

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 123 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const { startExpiredInventoryHoldReleaseService } = await import("../releaseExpiredInventoryHoldsService");
    const stop = startExpiredInventoryHoldReleaseService({
      intervalMs: 5000,
      releaseFn: releaseFn as any,
    });

    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    await Promise.resolve();
    await Promise.resolve();
    expect(releaseFn).toHaveBeenCalledWith({ limit: 100 });

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});
