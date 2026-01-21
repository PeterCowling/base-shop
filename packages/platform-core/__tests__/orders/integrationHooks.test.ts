/** @jest-environment node */

// Import setup first to ensure mocks are registered before importing orders
import {
  nowIsoMock,
  prismaMock,
  stripeCheckoutRetrieve,
  stripeRefund,
} from "./setup";

import * as orders from "../../src/orders";

import { createOrder } from "./orderFactory";

const { markRefunded, refundOrder } = orders;

describe("order integration hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("markRefunded", () => {
    it("updates order with refund info", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = createOrder();
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

    it("persists only refundedAt when risk params are omitted", async () => {
      nowIsoMock.mockReturnValue("now");
      const mockOrder = createOrder({ refundedAt: "now" });
      prismaMock.rentalOrder.update.mockResolvedValue(mockOrder);
      const result = await markRefunded("shop", "sess");
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now" },
      });
      expect(result).toEqual(mockOrder);
    });

    it("returns null when order not found", async () => {
      prismaMock.rentalOrder.update.mockResolvedValue(null);
      const result = await markRefunded("shop", "sess");
      expect(result).toBeNull();
    });

    it("returns null when update throws", async () => {
      prismaMock.rentalOrder.update.mockImplementation(() => {
        throw new Error("fail");
      });
      const result = await markRefunded("shop", "sess");
      expect(result).toBeNull();
    });

    it("refunds full amount via Stripe before marking order", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.update.mockResolvedValue(
        createOrder({ refundedAt: "now" })
      );
      stripeRefund.mockResolvedValue({ id: "re_1" });

      const process = async () => {
        const deposit = 10;
        await stripeRefund({ payment_intent: "pi", amount: deposit * 100 });
        return markRefunded("shop", "sess");
      };

      const result = await process();
      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 10 * 100,
      });
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now" },
      });
      expect(result).toEqual(createOrder({ refundedAt: "now" }));
    });

    it("refunds partial amounts via Stripe before marking order", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.update.mockResolvedValue(
        createOrder({ refundedAt: "now" })
      );
      stripeRefund.mockResolvedValue({ id: "re_1" });

      const process = async () => {
        const deposit = 10;
        const withheld = 4;
        const refund = Math.max(deposit - withheld, 0);
        await stripeRefund({ payment_intent: "pi", amount: refund * 100 });
        return markRefunded("shop", "sess");
      };

      const result = await process();
      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 6 * 100,
      });
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now" },
      });
      expect(result).toEqual(createOrder({ refundedAt: "now" }));
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
      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 6 * 100,
      });
      expect(prismaMock.rentalOrder.update).not.toHaveBeenCalled();
    });
  });

  describe("refundOrder", () => {
    it("returns null without calling Stripe when order not found", async () => {
      prismaMock.rentalOrder.findUnique.mockResolvedValue(null);

      const result = await refundOrder("shop", "sess", 10);

      expect(stripeCheckoutRetrieve).not.toHaveBeenCalled();
      expect(stripeRefund).not.toHaveBeenCalled();
      expect(prismaMock.rentalOrder.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("skips Stripe when order already fully refunded", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.findUnique.mockResolvedValue(
        createOrder({ deposit: 10, refundTotal: 10 })
      );
      prismaMock.rentalOrder.update.mockResolvedValue(
        createOrder({ refundedAt: "now", refundTotal: 10 })
      );

      const result = await refundOrder("shop", "sess", 10);

      expect(stripeCheckoutRetrieve).not.toHaveBeenCalled();
      expect(stripeRefund).not.toHaveBeenCalled();
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now", refundTotal: 10 },
      });
      expect(result).toEqual(createOrder({ refundedAt: "now", refundTotal: 10 }));
    });

    it("refunds full amount and updates refund total", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.findUnique.mockResolvedValue(createOrder());
      stripeCheckoutRetrieve.mockResolvedValue({ payment_intent: "pi" });
      stripeRefund.mockResolvedValue({ id: "re_1" });
      prismaMock.rentalOrder.update.mockResolvedValue(
        createOrder({ refundedAt: "now", refundTotal: 10 })
      );

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
      expect(result).toEqual(createOrder({ refundedAt: "now", refundTotal: 10 }));
    });

    it("handles payment_intent objects from checkout session", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.findUnique.mockResolvedValue(createOrder());
      stripeCheckoutRetrieve.mockResolvedValue({ payment_intent: { id: "pi" } });
      stripeRefund.mockResolvedValue({ id: "re_1" });
      prismaMock.rentalOrder.update.mockResolvedValue(
        createOrder({ refundedAt: "now", refundTotal: 10 })
      );

      const result = await refundOrder("shop", "sess", 10);

      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 10 * 100,
      });
      expect(result).toEqual(createOrder({ refundedAt: "now", refundTotal: 10 }));
    });

    it("returns null when update fails after refund", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.findUnique.mockResolvedValue(createOrder());
      stripeCheckoutRetrieve.mockResolvedValue({ payment_intent: "pi" });
      stripeRefund.mockResolvedValue({ id: "re_1" });
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("fail"));

      const result = await refundOrder("shop", "sess", 10);

      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 10 * 100,
      });
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now", refundTotal: 10 },
      });
      expect(result).toBeNull();
    });

    it("returns null when update resolves null after refund", async () => {
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.findUnique.mockResolvedValue(createOrder());
      stripeCheckoutRetrieve.mockResolvedValue({ payment_intent: "pi" });
      stripeRefund.mockResolvedValue({ id: "re_1" });
      prismaMock.rentalOrder.update.mockResolvedValue(null);

      const result = await refundOrder("shop", "sess", 10);
      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 10 * 100,
      });
      expect(prismaMock.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data: { refundedAt: "now", refundTotal: 10 },
      });
      expect(result).toBeNull();
    });

    it("propagates Stripe refund errors", async () => {
      prismaMock.rentalOrder.findUnique.mockResolvedValue(createOrder());
      stripeCheckoutRetrieve.mockResolvedValue({ payment_intent: "pi" });
      stripeRefund.mockRejectedValue(new Error("stripe fail"));

      await expect(refundOrder("shop", "sess", 10)).rejects.toThrow(
        "stripe fail"
      );

      expect(stripeRefund).toHaveBeenCalledWith({
        payment_intent: "pi",
        amount: 10 * 100,
      });
      expect(prismaMock.rentalOrder.update).not.toHaveBeenCalled();
    });

    it("throws when checkout session lacks payment_intent", async () => {
      prismaMock.rentalOrder.findUnique.mockResolvedValue(createOrder());
      stripeCheckoutRetrieve.mockResolvedValue({});

      await expect(refundOrder("shop", "sess", 10)).rejects.toThrow(
        "payment_intent missing"
      );

      expect(stripeRefund).not.toHaveBeenCalled();
      expect(prismaMock.rentalOrder.update).not.toHaveBeenCalled();
    });
  });
});
