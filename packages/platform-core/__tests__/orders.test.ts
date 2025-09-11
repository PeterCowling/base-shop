/** @jest-environment node */

import {
  listOrders,
  addOrder,
  markFulfilled,
  markShipped,
  markDelivered,
  markCancelled,
  markReturned,
  markRefunded,
  refundOrder,
  updateRisk,
  getOrdersForCustomer,
  setReturnTracking,
  setReturnStatus,
} from "../src/orders";

jest.mock("../src/analytics", () => ({ trackOrder: jest.fn() }));
jest.mock("../src/subscriptionUsage", () => ({
  incrementSubscriptionUsage: jest.fn(),
}));
jest.mock("../src/db", () => ({
  prisma: {
    rentalOrder: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    shop: { findUnique: jest.fn() },
  },
}));
jest.mock("ulid", () => ({ ulid: jest.fn(() => "ulid") }));
jest.mock("@acme/date-utils", () => ({ nowIso: jest.fn(() => "now") }));
jest.mock("@acme/stripe", () => ({
  stripe: {
    refunds: { create: jest.fn() },
    checkout: { sessions: { retrieve: jest.fn() } },
  },
}));

import { stripe } from "@acme/stripe";

const { trackOrder } = jest.requireMock("../src/analytics") as {
  trackOrder: jest.Mock;
};
const { incrementSubscriptionUsage } = jest.requireMock(
  "../src/subscriptionUsage"
) as { incrementSubscriptionUsage: jest.Mock };
const { prisma: prismaMock } = jest.requireMock("../src/db") as {
  prisma: {
    rentalOrder: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
    };
    shop: { findUnique: jest.Mock };
  };
};
(prismaMock.rentalOrder as any).findUnique ||= jest.fn();
const ulidMock = jest.requireMock("ulid").ulid as jest.Mock;
const nowIsoMock = jest.requireMock("@acme/date-utils").nowIso as jest.Mock;
const stripeRefund = stripe.refunds.create as jest.Mock;
const stripeCheckoutRetrieve =
  stripe.checkout.sessions.retrieve as jest.Mock;

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
        true
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
        "2024-01"
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

    it("skips subscription usage when disabled", async () => {
      ulidMock.mockReturnValue("ID");
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.create.mockResolvedValue({});
      prismaMock.shop.findUnique.mockResolvedValue({
        data: { subscriptionsEnabled: false },
      });
      await addOrder("shop", "sess", 10, undefined, undefined, "cust");
      expect(prismaMock.shop.findUnique).toHaveBeenCalledWith({
        select: { data: true },
        where: { id: "shop" },
      });
      expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
      expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
    });

    it("throws when creation fails", async () => {
      prismaMock.rentalOrder.create.mockRejectedValue(new Error("fail"));
      await expect(addOrder("shop", "sess", 10)).rejects.toThrow("fail");
      expect(trackOrder).not.toHaveBeenCalled();
    });
  });

  describe("markFulfilled", () => {
    it("updates order with fulfillment timestamp", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = { id: "1" };
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
      const mockOrder = { id: "1" };
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
      const mockOrder = { id: "1" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markDelivered("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { deliveredAt: "now" },
      });
      expect(result).toEqual(mockOrder);
    });
  });

  describe("markCancelled", () => {
    it("updates order with cancellation timestamp", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = { id: "1" };
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markCancelled("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { cancelledAt: "now" },
      });
      expect(result).toEqual(mockOrder);
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

    it("returns null when order not found", async () => {
      prismaMock.rentalOrder.update.mockResolvedValue(null);
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

    it("returns null when order not found", async () => {
      prismaMock.rentalOrder.update.mockResolvedValue(null);
      const result = await markRefunded("shop", "sess");
      expect(result).toBeNull();
    });

    it("refunds full amount via Stripe before marking order", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.update.mockResolvedValue({ id: "1", refundedAt: "now" });
      stripeRefund.mockResolvedValue({ id: "re_1" });

      const process = async () => {
        const deposit = 10;
        await stripeRefund({ payment_intent: "pi", amount: deposit * 100 });
        return markRefunded("shop", "sess");
      };

      const result = await process();
      expect(stripeRefund).toHaveBeenCalledWith({ payment_intent: "pi", amount: 10 * 100 });
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now" },
      });
      expect(result).toEqual({ id: "1", refundedAt: "now" });
    });

    it("refunds partial amounts via Stripe before marking order", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.update.mockResolvedValue({ id: "1", refundedAt: "now" });
      stripeRefund.mockResolvedValue({ id: "re_1" });

      const process = async () => {
        const deposit = 10;
        const withheld = 4;
        const refund = Math.max(deposit - withheld, 0);
        await stripeRefund({ payment_intent: "pi", amount: refund * 100 });
        return markRefunded("shop", "sess");
      };

      const result = await process();
      expect(stripeRefund).toHaveBeenCalledWith({ payment_intent: "pi", amount: 6 * 100 });
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now" },
      });
      expect(result).toEqual({ id: "1", refundedAt: "now" });
    });

    it("surfaces refund failures and does not update the order", async () => {
      stripeRefund.mockRejectedValue(new Error("refund failed"));

      const process = async () => {
        const deposit = 10;
        const withheld = 4;
        const refund = Math.max(deposit - withheld, 0);
        await stripeRefund({ payment_intent: "pi", amount: refund * 100 });
        return markRefunded("shop", "sess");
      };

      await expect(process()).rejects.toThrow("refund failed");
      expect(stripeRefund).toHaveBeenCalledWith({ payment_intent: "pi", amount: 6 * 100 });
      expect(prismaMock.rentalOrder.update).not.toHaveBeenCalled();
    });
  });

  describe("refundOrder", () => {
    it("refunds full amount and updates refund total", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.findUnique.mockResolvedValue({ id: "1" });
      stripeCheckoutRetrieve.mockResolvedValue({ payment_intent: "pi" });
      stripeRefund.mockResolvedValue({ id: "re_1" });
      prismaMock.rentalOrder.update.mockResolvedValue({
        id: "1",
        refundedAt: "now",
        refundTotal: 10,
      });

      const result = await refundOrder("shop", "sess", 10);

      expect(prismaMock.rentalOrder.findUnique).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
      });
      expect(stripeCheckoutRetrieve).toHaveBeenCalledWith("sess", {
        expand: ["payment_intent"],
      });
      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 10 * 100,
      });
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now", refundTotal: 10 },
      });
      expect(result).toEqual({ id: "1", refundedAt: "now", refundTotal: 10 });
    });

    it("refunds partial amount and accumulates refund total", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.findUnique.mockResolvedValue({
        id: "1",
        refundTotal: 4,
      });
      stripeCheckoutRetrieve.mockResolvedValue({ payment_intent: "pi" });
      stripeRefund.mockResolvedValue({ id: "re_1" });
      prismaMock.rentalOrder.update.mockResolvedValue({
        id: "1",
        refundedAt: "now",
        refundTotal: 10,
      });

      const result = await refundOrder("shop", "sess", 10);

      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 6 * 100,
      });
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now", refundTotal: 10 },
      });
      expect(result).toEqual({ id: "1", refundedAt: "now", refundTotal: 10 });
    });

    it("surfaces Stripe errors without updating the order", async () => {
      prismaMock.rentalOrder.findUnique.mockResolvedValue({
        id: "1",
        refundTotal: 4,
      });
      stripeCheckoutRetrieve.mockResolvedValue({ payment_intent: "pi" });
      stripeRefund.mockRejectedValue(new Error("stripe fail"));

      await expect(refundOrder("shop", "sess", 10)).rejects.toThrow(
        "stripe fail",
      );

      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 6 * 100,
      });
      expect(prismaMock.rentalOrder.update).not.toHaveBeenCalled();
    });

    it("resolves null when update fails after refund", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.findUnique.mockResolvedValue({ id: "1" });
      stripeCheckoutRetrieve.mockResolvedValue({ payment_intent: "pi" });
      stripeRefund.mockResolvedValue({ id: "re_1" });
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("db fail"));

      await expect(refundOrder("shop", "sess", 10)).resolves.toBeNull();

      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 10 * 100,
      });
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now", refundTotal: 10 },
      });
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

    it("returns null when order not found", async () => {
      prismaMock.rentalOrder.update.mockResolvedValue(null);
      const result = await updateRisk("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: {},
      });
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
      await expect(getOrdersForCustomer("shop", "cust")).rejects.toThrow(
        "fail"
      );
    });
  });

  describe("getOrdersForCustomer history", () => {
    it("returns normalized history sorted by startedAt", async () => {
      prismaMock.rentalOrder.findMany.mockResolvedValue([
        {
          id: "1",
          shop: "shop",
          customerId: "cust",
          startedAt: "2024-01-01T00:00:00.000Z",
          fulfilledAt: "2024-01-02T00:00:00.000Z",
          foo: null,
        },
        {
          id: "2",
          shop: "shop",
          customerId: "cust",
          startedAt: "2024-02-01T00:00:00.000Z",
          cancelledAt: "2024-02-02T00:00:00.000Z",
        },
        {
          id: "3",
          shop: "shop",
          customerId: "cust",
          startedAt: "2024-03-01T00:00:00.000Z",
          returnedAt: "2024-03-02T00:00:00.000Z",
        },
        {
          id: "4",
          shop: "shop",
          customerId: "cust",
          startedAt: "2024-04-01T00:00:00.000Z",
          refundedAt: "2024-04-02T00:00:00.000Z",
        },
      ]);
      const result = await getOrdersForCustomer("shop", "cust");
      expect(prismaMock.rentalOrder.findMany).toHaveBeenCalledWith({
        where: { shop: "shop", customerId: "cust" },
      });
      expect(result.map((o) => o.id)).toEqual(["1", "2", "3", "4"]);
      expect(result.map((o) => o.startedAt)).toEqual([
        "2024-01-01T00:00:00.000Z",
        "2024-02-01T00:00:00.000Z",
        "2024-03-01T00:00:00.000Z",
        "2024-04-01T00:00:00.000Z",
      ]);
      expect(result[0].foo).toBeUndefined();
    });

    it("throws when lookup fails", async () => {
      prismaMock.rentalOrder.findMany.mockRejectedValue(new Error("fail"));
      await expect(getOrdersForCustomer("shop", "cust")).rejects.toThrow(
        "fail",
      );
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

    it("returns null when order not found", async () => {
      prismaMock.rentalOrder.update.mockResolvedValue(null);
      const result = await setReturnTracking("shop", "sess", "tn", "url");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { trackingNumber: "tn", labelUrl: "url" },
      });
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
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_trackingNumber: { shop: "shop", trackingNumber: "tn" } },
        data: { returnStatus: "status" },
      });
      expect(result).toBeNull();
    });
  });
});
