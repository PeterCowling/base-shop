/** @jest-environment node */

import "./setup";
import * as orders from "../../src/orders";
import { prismaMock, nowIsoMock } from "./setup";
import { createOrder } from "./orderFactory";

const {
  markFulfilled,
  markShipped,
  markDelivered,
  markCancelled,
  markReturned,
  updateRisk,
  markNeedsAttention,
  setReturnTracking,
  setReturnStatus,
} = orders;

describe("order status transitions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("markFulfilled", () => {
    it("updates order with fulfillment timestamp", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markFulfilled("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { fulfilledAt: "now" },
      });
      expect(result).toEqual(mockOrder);
    });

    it("propagates errors", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      await expect(markFulfilled("shop", "sess")).rejects.toThrow("fail");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { fulfilledAt: "now" },
      });
    });
  });

  describe("markShipped", () => {
    it("updates order with shipment timestamp", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markShipped("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { shippedAt: "now" },
      });
      expect(result).toEqual(mockOrder);
    });

    it("propagates errors", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      await expect(markShipped("shop", "sess")).rejects.toThrow("fail");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { shippedAt: "now" },
      });
    });
  });

  describe("markDelivered", () => {
    it("updates order with delivery timestamp", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markDelivered("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { deliveredAt: "now" },
      });
      expect(result).toEqual(mockOrder);
    });

    it("propagates errors", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      await expect(markDelivered("shop", "sess")).rejects.toThrow("fail");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { deliveredAt: "now" },
      });
    });
  });

  describe("markCancelled", () => {
    it("updates order with cancellation timestamp", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markCancelled("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { cancelledAt: "now" },
      });
      expect(result).toEqual(mockOrder);
    });

    it("propagates errors", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      await expect(markCancelled("shop", "sess")).rejects.toThrow("fail");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { cancelledAt: "now" },
      });
    });
  });

  describe("markReturned", () => {
    it("updates order with return info", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markReturned("shop", "sess", 5);
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { returnedAt: "now", damageFee: 5 },
      });
      expect(result).toEqual(mockOrder);
    });

    it("returns null when order not found", async () => {
      prismaMock.rentalOrder.update.mockResolvedValue(null);
      const result = await markReturned("shop", "sess");
      expect(result).toBeNull();
    });
  });

  describe("updateRisk", () => {
    it("updates risk fields", async () => {
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await updateRisk("shop", "sess", "high", 10, true);
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { riskLevel: "high", riskScore: 10, flaggedForReview: true },
      });
      expect(result).toEqual(mockOrder);
    });

    it("returns null when order not found", async () => {
      prismaMock.rentalOrder.update.mockResolvedValue(null);
      const result = await updateRisk("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: {},
      });
      expect(result).toBeNull();
    });

    it("returns null on error", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      const result = await updateRisk("shop", "sess");
      expect(result).toBeNull();
    });

    it("updates only riskLevel when provided", async () => {
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await updateRisk("shop", "sess", "low");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { riskLevel: "low" },
      });
      expect(result).toEqual(mockOrder);
    });

    it("updates only riskScore when provided", async () => {
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await updateRisk("shop", "sess", undefined, 0);
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { riskScore: 0 },
      });
      expect(result).toEqual(mockOrder);
    });

    it("updates only flaggedForReview when provided", async () => {
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await updateRisk(
        "shop",
        "sess",
        undefined,
        undefined,
        false,
      );
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { flaggedForReview: false },
      });
      expect(result).toEqual(mockOrder);
    });
  });

  describe("markNeedsAttention", () => {
    it("flags order for review", async () => {
      const flagged = createOrder({ flaggedForReview: true });
      prismaMock.rentalOrder.update.mockResolvedValue(flagged);
      const result = await markNeedsAttention("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { flaggedForReview: true },
      });
      expect(result).toEqual(flagged);
    });

    it("returns null when update fails", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));
      const result = await markNeedsAttention("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { flaggedForReview: true },
      });
      expect(result).toBeNull();
    });
  });

  describe("setReturnTracking", () => {
    it("stores tracking info", async () => {
      const mockOrder = createOrder();
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await setReturnTracking("shop", "sess", "tn", "url");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { trackingNumber: "tn", labelUrl: "url" },
      });
      expect(result).toEqual(mockOrder);
    });

    it("returns null when order not found", async () => {
      prismaMock.rentalOrder.update.mockResolvedValue(null);
      const result = await setReturnTracking("shop", "sess", "tn", "url");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { trackingNumber: "tn", labelUrl: "url" },
      });
      expect(result).toBeNull();
    });

    it("returns null on error", async () => {
      prismaMock.rentalOrder.update.mockRejectedValueOnce(new Error("fail"));
      await expect(
        setReturnTracking("shop", "sess", "tn", "url")
      ).resolves.toBeNull();
    });
  });

  describe("setReturnStatus", () => {
    it("updates return status", async () => {
      const mockOrder = createOrder();
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
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_trackingNumber: { shop: "shop", trackingNumber: "tn" } },
        data: { returnStatus: "status" },
      });
      expect(result).toBeNull();
    });
  });
});
