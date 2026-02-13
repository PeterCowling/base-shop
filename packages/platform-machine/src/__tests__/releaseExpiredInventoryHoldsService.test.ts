/** @jest-environment node */

describe("releaseExpiredInventoryHoldsOnce", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("releases expired holds and restores inventory", async () => {
    jest.useFakeTimers();
    const startTime = new Date("2025-01-01T00:00:00.000Z");
    jest.setSystemTime(startTime);

    const { prisma } = await import("@acme/platform-core/db");
    const { variantKey } = await import("@acme/platform-core/types/inventory");
    const { createInventoryHold } = await import("@acme/platform-core/inventoryHolds");
    const { releaseExpiredInventoryHoldsOnce } = await import("../releaseExpiredInventoryHoldsService");

    const shopId = "shop1";
    const sku = "sku_1";
    const productId = "prod_1";
    const key = variantKey(sku, {});
    await prisma.inventoryItem.createMany({
      data: [{ shopId, sku, productId, variantKey: key, quantity: 2 }],
    });

    const hold = await createInventoryHold({
      shopId,
      requests: [{ sku, quantity: 1, variantAttributes: {} }],
      ttlSeconds: 30, // minimum is 30 seconds
    });
    expect(hold.holdId).toBeTruthy();
    expect(hold.expiresAt).toBeInstanceOf(Date);

    const itemAfterHold = await prisma.inventoryItem.findUnique({
      where: { shopId_sku_variantKey: { shopId, sku, variantKey: key } },
    });
    expect(itemAfterHold?.quantity).toBe(1);

    // Advance time by 31 seconds (past the 30 second ttl)
    jest.advanceTimersByTime(31000);
    const nowAfterAdvance = new Date();
    const res = await releaseExpiredInventoryHoldsOnce({
      now: nowAfterAdvance,
    });
    expect(res.scanned).toBe(1);
    expect(res.released).toBe(1);

    const itemAfterRelease = await prisma.inventoryItem.findUnique({
      where: { shopId_sku_variantKey: { shopId, sku, variantKey: key } },
    });
    expect(itemAfterRelease?.quantity).toBe(2);

    const holdAfterRelease = await prisma.inventoryHold.findUnique({
      where: { shopId_holdId: { shopId, holdId: hold.holdId } },
    });
    expect(holdAfterRelease?.status).toBe("released");
  });

  it("does not release holds that have not expired", async () => {
    jest.useFakeTimers();
    const startTime = new Date("2025-01-01T00:00:00.000Z");
    jest.setSystemTime(startTime);

    const { prisma } = await import("@acme/platform-core/db");
    const { variantKey } = await import("@acme/platform-core/types/inventory");
    const { createInventoryHold } = await import("@acme/platform-core/inventoryHolds");
    const { releaseExpiredInventoryHoldsOnce } = await import("../releaseExpiredInventoryHoldsService");

    const shopId = "shop2";
    const sku = "sku_2";
    const productId = "prod_2";
    const key = variantKey(sku, {});
    await prisma.inventoryItem.createMany({
      data: [{ shopId, sku, productId, variantKey: key, quantity: 1 }],
    });

    await createInventoryHold({
      shopId,
      requests: [{ sku, quantity: 1, variantAttributes: {} }],
      ttlSeconds: 60,
    });

    // Advance by 1 second (hold has 60 second ttl, so it's not expired)
    jest.advanceTimersByTime(1000);
    const res = await releaseExpiredInventoryHoldsOnce({ now: new Date() });
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
