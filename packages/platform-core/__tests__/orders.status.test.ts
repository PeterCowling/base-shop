/** @jest-environment node */

import {
  markCancelled,
  markDelivered,
  markFulfilled,
  markReturned,
  markShipped,
  setReturnTracking,
  setReturnStatus,
} from "../src/orders/status";

jest.mock("../src/db", () => ({
  prisma: {
    rentalOrder: { update: jest.fn() },
  },
}));

const { prisma } = jest.requireMock("../src/db") as {
  prisma: { rentalOrder: { update: jest.Mock } };
};

describe("orders/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks order fulfilled", async () => {
    const mock = { id: "1", shop: "shop", sessionId: "sess", fulfilledAt: "now" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await markFulfilled("shop", "sess");
    expect(prisma.rentalOrder.update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
      data: { fulfilledAt: expect.any(String) },
    });
    expect(result).toEqual(mock);
  });

  it("marks order shipped", async () => {
    const mock = { id: "1", shop: "shop", sessionId: "sess", shippedAt: "now" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await markShipped("shop", "sess");
    expect(prisma.rentalOrder.update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
      data: { shippedAt: expect.any(String) },
    });
    expect(result).toEqual(mock);
  });

  it("marks order delivered", async () => {
    const mock = { id: "1", shop: "shop", sessionId: "sess", deliveredAt: "now" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await markDelivered("shop", "sess");
    expect(prisma.rentalOrder.update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
      data: { deliveredAt: expect.any(String) },
    });
    expect(result).toEqual(mock);
  });

  it("marks order cancelled", async () => {
    const mock = { id: "1", shop: "shop", sessionId: "sess", cancelledAt: "now" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await markCancelled("shop", "sess");
    expect(prisma.rentalOrder.update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
      data: { cancelledAt: expect.any(String) },
    });
    expect(result).toEqual(mock);
  });

  it("includes damage fee when provided", async () => {
    const mock = { id: "1", shop: "shop", sessionId: "sess", damageFee: 4, returnedAt: "now" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await markReturned("shop", "sess", 4);
    expect(prisma.rentalOrder.update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
      data: { returnedAt: expect.any(String), damageFee: 4 },
    });
    expect(result).toEqual(mock);
  });

  it("omits damage fee when not provided", async () => {
    const mock = { id: "1", shop: "shop", sessionId: "sess", returnedAt: "now" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await markReturned("shop", "sess");
    expect(prisma.rentalOrder.update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
      data: { returnedAt: expect.any(String) },
    });
    expect(result).toEqual(mock);
  });

  it("returns null when markReturned update throws", async () => {
    prisma.rentalOrder.update.mockRejectedValue(new Error("not found"));
    await expect(markReturned("shop", "sess")).resolves.toBeNull();
  });

  it("returns null when markReturned update yields null and damage fee undefined", async () => {
    prisma.rentalOrder.update.mockResolvedValue(null);
    const result = await markReturned("shop", "sess", undefined);
    expect(result).toBeNull();
  });

  it("sets return tracking", async () => {
    const mock = { id: "1", trackingNumber: "trk", labelUrl: "url" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await setReturnTracking("shop", "sess", "trk", "url");
    expect(prisma.rentalOrder.update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
      data: { trackingNumber: "trk", labelUrl: "url" },
    });
    expect(result).toEqual(mock);
  });

  it("returns null when return tracking update yields null", async () => {
    prisma.rentalOrder.update.mockResolvedValue(null);
    const result = await setReturnTracking("shop", "sess", "trk", "url");
    expect(result).toBeNull();
  });

  it("returns null when return tracking update throws", async () => {
    prisma.rentalOrder.update.mockRejectedValue(new Error("fail"));
    await expect(setReturnTracking("shop", "sess", "trk", "url")).resolves.toBeNull();
  });

  it("sets return status", async () => {
    const mock = { id: "1", returnStatus: "rec" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await setReturnStatus("shop", "trk", "rec");
    expect(prisma.rentalOrder.update).toHaveBeenCalledWith({
      where: { shop_trackingNumber: { shop: "shop", trackingNumber: "trk" } },
      data: { returnStatus: "rec" },
    });
    expect(result).toEqual(mock);
  });

  it("returns null when return status update yields null", async () => {
    prisma.rentalOrder.update.mockResolvedValue(null);
    const result = await setReturnStatus("shop", "trk", "rec");
    expect(result).toBeNull();
  });

  it("returns null when return status update throws", async () => {
    prisma.rentalOrder.update.mockRejectedValue(new Error("fail"));
    await expect(setReturnStatus("shop", "trk", "rec")).resolves.toBeNull();
  });
});

