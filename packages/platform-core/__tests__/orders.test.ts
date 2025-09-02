/** @jest-environment node */

import {
  addOrder,
  markReturned,
  markRefunded,
  updateRisk,
  getOrdersForCustomer,
  setReturnTracking,
  setReturnStatus,
} from "../src/orders";

const trackOrder = jest.fn();
const incrementSubscriptionUsage = jest.fn();

const prismaMock = {
  rentalOrder: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  shop: {
    findUnique: jest.fn(),
  },
};

jest.mock("../src/analytics", () => ({ trackOrder }));
jest.mock("../src/subscriptionUsage", () => ({ incrementSubscriptionUsage }));
jest.mock("../src/db", () => ({ prisma: prismaMock }));

describe("orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addOrder", () => {
    it("creates order and tracks it", async () => {
      prismaMock.rentalOrder.create.mockResolvedValue({});
      prismaMock.shop.findUnique.mockResolvedValue({ data: {} });
      const order = await addOrder("shop", "sess", 10, undefined, undefined, "cust");
      expect(prismaMock.rentalOrder.create).toHaveBeenCalled();
      expect(trackOrder).toHaveBeenCalledWith("shop", order.id, 10);
      expect(order).toMatchObject({ shop: "shop", sessionId: "sess", deposit: 10 });
    });

    it("throws when creation fails", async () => {
      prismaMock.rentalOrder.create.mockRejectedValue(new Error("fail"));
      await expect(addOrder("shop", "sess", 10)).rejects.toThrow("fail");
      expect(trackOrder).not.toHaveBeenCalled();
    });
  });

  describe("markReturned", () => {
    it("updates order with return info", async () => {
      const mockOrder = { id: "1", returnedAt: "now" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markReturned("shop", "sess", 5);
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
      const mockOrder = { id: "1", refundedAt: "now" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markRefunded("shop", "sess", "low", 1, true);
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
      const mockOrder = { id: "1", riskLevel: "high" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await updateRisk("shop", "sess", "high", 10, true);
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
      const mockOrder = { id: "1", trackingNumber: "tn", labelUrl: "url" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await setReturnTracking("shop", "sess", "tn", "url");
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
      const mockOrder = { id: "1", returnStatus: "received" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await setReturnStatus("shop", "tn", "received");
      expect(result).toEqual(mockOrder);
    });

    it("returns null on failure", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      const result = await setReturnStatus("shop", "tn", "status");
      expect(result).toBeNull();
    });
  });
});
