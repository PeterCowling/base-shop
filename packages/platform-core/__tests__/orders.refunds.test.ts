/** @jest-environment node */

import { markRefunded, refundOrder } from "../src/orders/refunds";

jest.mock("../src/db", () => ({
  prisma: {
    rentalOrder: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@acme/stripe", () => ({
  stripe: {
    refunds: { create: jest.fn() },
    checkout: { sessions: { retrieve: jest.fn() } },
  },
}));

const { prisma } = jest.requireMock("../src/db") as {
  prisma: { rentalOrder: { update: jest.Mock; findUnique: jest.Mock } };
};

const { stripe } = jest.requireMock("@acme/stripe") as {
  stripe: {
    refunds: { create: jest.Mock };
    checkout: { sessions: { retrieve: jest.Mock } };
  };
};

describe("orders/refunds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("markRefunded", () => {
    it("records refund timestamp", async () => {
      const mock = { id: "1", shop: "shop", sessionId: "sess", refundedAt: "now" };
      prisma.rentalOrder.update.mockResolvedValue(mock);
      const result = await markRefunded("shop", "sess");
      expect(result).toEqual(mock);
      expect(result?.refundedAt).toBe("now");
    });

    it("returns null when update throws", async () => {
      prisma.rentalOrder.update.mockImplementation(() => {
        throw new Error("missing");
      });
      const result = await markRefunded("shop", "sess");
      expect(result).toBeNull();
    });
  });

  describe("refundOrder", () => {
    it("returns null when order missing", async () => {
      prisma.rentalOrder.findUnique.mockResolvedValue(null);
      const res = await refundOrder("s", "sess");
      expect(res).toBeNull();
      expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
      expect(stripe.refunds.create).not.toHaveBeenCalled();
      expect(prisma.rentalOrder.update).not.toHaveBeenCalled();
    });

    it("returns null when update throws", async () => {
      const order = {
        id: "1",
        shop: "s",
        sessionId: "sess",
        deposit: 0,
        refundTotal: 0,
      };
      prisma.rentalOrder.findUnique.mockResolvedValue(order);
      prisma.rentalOrder.update.mockImplementation(() => {
        throw new Error("db");
      });
      const res = await refundOrder("s", "sess");
      expect(res).toBeNull();
      expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
      expect(stripe.refunds.create).not.toHaveBeenCalled();
    });

    it("returns null when update returns null", async () => {
      const order = {
        id: "1",
        shop: "s",
        sessionId: "sess",
        deposit: 0,
        refundTotal: 0,
      };
      prisma.rentalOrder.findUnique.mockResolvedValue(order);
      prisma.rentalOrder.update.mockResolvedValue(null);
      const res = await refundOrder("s", "sess");
      expect(res).toBeNull();
      expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
      expect(stripe.refunds.create).not.toHaveBeenCalled();
    });

    it.each([
      { deposit: 100, refundTotal: 0, amount: undefined, refundable: 100 },
      { deposit: 200, refundTotal: 50, amount: 100, refundable: 100 },
      { deposit: 50, refundTotal: 25, amount: 100, refundable: 25 },
    ])(
      "refunds correct amount for %o",
      async ({ deposit, refundTotal, amount, refundable }) => {
        const order = { id: "1", shop: "s", sessionId: "sess", deposit, refundTotal };
        prisma.rentalOrder.findUnique.mockResolvedValue(order);
        prisma.rentalOrder.update.mockResolvedValue({
          ...order,
          refundedAt: "now",
          refundTotal: refundTotal + refundable,
        });
        stripe.checkout.sessions.retrieve.mockResolvedValue({
          payment_intent: "pi_123",
        });

        const result = await refundOrder("s", "sess", amount);

        expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith("sess", {
          expand: ["payment_intent"],
        });
        expect(stripe.refunds.create).toHaveBeenCalledWith({
          payment_intent: "pi_123",
          amount: Math.round(refundable * 100),
        });
        expect(result?.refundTotal).toBe(refundTotal + refundable);
      },
    );

    it("does nothing when refundable is zero", async () => {
      const order = { id: "1", shop: "s", sessionId: "sess", deposit: 30, refundTotal: 30 };
      prisma.rentalOrder.findUnique.mockResolvedValue(order);
      prisma.rentalOrder.update.mockResolvedValue({
        ...order,
        refundedAt: "now",
        refundTotal: 30,
      });

      const res = await refundOrder("s", "sess", 10);

      expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
      expect(stripe.refunds.create).not.toHaveBeenCalled();
      expect(res?.refundTotal).toBe(30);
    });

    it("throws when payment_intent missing", async () => {
      const order = { id: "1", shop: "s", sessionId: "sess", deposit: 10, refundTotal: 0 };
      prisma.rentalOrder.findUnique.mockResolvedValue(order);
      stripe.checkout.sessions.retrieve.mockResolvedValue({});
      await expect(refundOrder("s", "sess")).rejects.toThrow("payment_intent missing");
    });
  });
});
