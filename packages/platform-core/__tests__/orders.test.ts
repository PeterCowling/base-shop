/** @jest-environment node */

import {
  listOrders,
  addOrder,
  markReturned,
  markRefunded,
  updateRisk,
  getOrdersForCustomer,
  setReturnTracking,
  setReturnStatus,
} from "../src/orders";

jest.mock("../src/analytics", () => ({ trackOrder: jest.fn() }));
jest.mock("../src/subscriptionUsage", () => ({ incrementSubscriptionUsage: jest.fn() }));
jest.mock("../src/db", () => ({
  prisma: {
    rentalOrder: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    shop: { findUnique: jest.fn() },
  },
}));
jest.mock("ulid", () => ({ ulid: jest.fn(() => "ulid") }));
jest.mock("@acme/date-utils", () => ({ nowIso: jest.fn(() => "now") }));

const { trackOrder } = jest.requireMock("../src/analytics") as {
  trackOrder: jest.Mock;
};
const { incrementSubscriptionUsage } = jest.requireMock(
  "../src/subscriptionUsage"
) as { incrementSubscriptionUsage: jest.Mock };
const { prisma: prismaMock } = jest.requireMock("../src/db") as {
  prisma: {
    rentalOrder: { findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
    shop: { findUnique: jest.Mock };
  };
};
const ulidMock = jest.requireMock("ulid").ulid as jest.Mock;
const nowIsoMock = jest.requireMock("@acme/date-utils").nowIso as jest.Mock;

describe("orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listOrders", () => {
    it("normalizes null fields", async () => {
      prismaMock.rentalOrder.findMany.mockResolvedValue([
        { id: "1", shop: "shop", foo: null },
      ]);
      const result = await listOrders("shop");
      expect(prismaMock.rentalOrder.findMany).toHaveBeenCalledWith({
        where: { shop: "shop" },
      });
      expect(result[0].foo).toBeUndefined();
    });
  });

  describe("addOrder", () => {
    it("generates ids, timestamps and tracks order", async () => {
      ulidMock.mockReturnValue("ID");
      nowIsoMock.mockReturnValue("2024-01-02T00:00:00.000Z");
      prismaMock.rentalOrder.create.mockResolvedValue({});
      prismaMock.shop.findUnique.mockResolvedValue({
        data: { subscriptionsEnabled: true },
      });
      const order = await addOrder(
        "shop",
        "sess",
        10,
        "exp",
        "due",
        "cust",
        "high",
        1,
        true,
      );
      expect(ulidMock).toHaveBeenCalled();
      expect(nowIsoMock).toHaveBeenCalledTimes(2);
      expect(prismaMock.rentalOrder.create).toHaveBeenCalledWith({
        data: order,
      });
      expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
      expect(incrementSubscriptionUsage).toHaveBeenCalledWith(
        "shop",
        "cust",
        "2024-01",
      );
      expect(order).toMatchObject({
        id: "ID",
        sessionId: "sess",
        shop: "shop",
        deposit: 10,
        startedAt: "2024-01-02T00:00:00.000Z",
        expectedReturnDate: "exp",
        returnDueDate: "due",
        customerId: "cust",
        riskLevel: "high",
        riskScore: 1,
        flaggedForReview: true,
      });
    });

    it("omits optional fields when not provided and skips subscription usage", async () => {
      ulidMock.mockReturnValue("ID");
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.create.mockResolvedValue({});
      const order = await addOrder("shop", "sess", 10);
      expect(prismaMock.rentalOrder.create).toHaveBeenCalledWith({
        data: order,
      });
      expect(order).toEqual({
        id: "ID",
        sessionId: "sess",
        shop: "shop",
        deposit: 10,
        startedAt: "now",
      });
      expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
      expect(prismaMock.shop.findUnique).not.toHaveBeenCalled();
      expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
    });

    it("throws when creation fails", async () => {
      prismaMock.rentalOrder.create.mockRejectedValue(new Error("fail"));
      await expect(addOrder("shop", "sess", 10)).rejects.toThrow("fail");
      expect(trackOrder).not.toHaveBeenCalled();
    });
  });

  describe("markReturned", () => {
    it("updates order with return info", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = { id: "1" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markReturned("shop", "sess", 5);
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { returnedAt: "now", damageFee: 5 },
      });
      expect(result).toEqual(mockOrder);
    });

    it("returns null on failure", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      const result = await markReturned("shop", "sess");
      expect(result).toBeNull();
    });
  });

  describe("markRefunded", () => {
    it("updates order with refund info", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = { id: "1" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markRefunded("shop", "sess", "low", 1, true);
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: {
          refundedAt: "now",
          riskLevel: "low",
          riskScore: 1,
          flaggedForReview: true,
        },
      });
      expect(result).toEqual(mockOrder);
    });

    it("returns null on failure", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      const result = await markRefunded("shop", "sess");
      expect(result).toBeNull();
    });
  });

  describe("updateRisk", () => {
    it("updates risk fields", async () => {
      const mockOrder = { id: "1" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await updateRisk("shop", "sess", "high", 10, true);
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { riskLevel: "high", riskScore: 10, flaggedForReview: true },
      });
      expect(result).toEqual(mockOrder);
    });

    it("returns null on failure", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      const result = await updateRisk("shop", "sess");
      expect(result).toBeNull();
    });
  });

  describe("getOrdersForCustomer", () => {
    it("returns normalized orders", async () => {
      prismaMock.rentalOrder.findMany.mockResolvedValue([
        { id: "1", shop: "shop", customerId: "cust", foo: null },
      ]);
      const result = await getOrdersForCustomer("shop", "cust");
      expect(prismaMock.rentalOrder.findMany).toHaveBeenCalledWith({
        where: { shop: "shop", customerId: "cust" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].foo).toBeUndefined();
    });

    it("throws when lookup fails", async () => {
      prismaMock.rentalOrder.findMany.mockRejectedValue(new Error("fail"));
      await expect(getOrdersForCustomer("shop", "cust")).rejects.toThrow("fail");
    });
  });

  describe("setReturnTracking", () => {
    it("stores tracking info", async () => {
      const mockOrder = { id: "1" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await setReturnTracking("shop", "sess", "tn", "url");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { trackingNumber: "tn", labelUrl: "url" },
      });
      expect(result).toEqual(mockOrder);
    });

    it("returns null on failure", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      const result = await setReturnTracking("shop", "sess", "tn", "url");
      expect(result).toBeNull();
    });
  });

  describe("setReturnStatus", () => {
    it("updates return status", async () => {
      const mockOrder = { id: "1" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await setReturnStatus("shop", "tn", "received");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_trackingNumber: { shop: "shop", trackingNumber: "tn" } },
        data: { returnStatus: "received" },
      });
      expect(result).toEqual(mockOrder);
    });

    it("returns null on failure", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      const result = await setReturnStatus("shop", "tn", "status");
      expect(result).toBeNull();
    });
  });
});
