/** @jest-environment node */

import { markReturned, setReturnTracking, setReturnStatus } from "../src/orders/status";

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
    prisma.rentalOrder.update.mockImplementation(() => {
      throw new Error("not found");
    });
    await expect(markReturned("shop", "sess")).resolves.toBeNull();
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
    prisma.rentalOrder.update.mockImplementation(() => {
      throw new Error("fail");
    });
    const result = await setReturnTracking("shop", "sess", "trk", "url");
    expect(result).toBeNull();
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

  it("returns null when return status update throws", async () => {
    prisma.rentalOrder.update.mockImplementation(() => {
      throw new Error("fail");
    });
    const result = await setReturnStatus("shop", "trk", "rec");
    expect(result).toBeNull();
  });
});

