/** @jest-environment node */

import {
  addOrder,
  markReturned,
  markRefunded,
  updateRisk,
} from "../orders";

jest.mock("../analytics", () => ({ trackOrder: jest.fn() }));
jest.mock("../db", () => ({
  prisma: {
    rentalOrder: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { trackOrder } = jest.requireMock("../analytics") as { trackOrder: jest.Mock };
const { prisma: prismaMock } = jest.requireMock("../db") as {
  prisma: {
    rentalOrder: { create: jest.Mock; update: jest.Mock };
  };
};

describe("orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addOrder", () => {
    it("persists order and tracks it", async () => {
      const mockOrder = {
        id: "1",
        shop: "shop",
        sessionId: "sess",
        deposit: 10,
      };
      prismaMock.rentalOrder.create.mockResolvedValue(mockOrder);

      const order = await addOrder("shop", "sess", 10);

      expect(prismaMock.rentalOrder.create).toHaveBeenCalled();
      expect(trackOrder).toHaveBeenCalledWith("shop", order.id, 10);
      expect(order).toMatchObject({ shop: "shop", sessionId: "sess", deposit: 10 });
    });

    it("throws on invalid quantity or missing items", async () => {
      prismaMock.rentalOrder.create.mockRejectedValue(new Error("Invalid quantity"));
      await expect(addOrder("shop", "sess", 10)).rejects.toThrow("Invalid quantity");
      expect(trackOrder).not.toHaveBeenCalled();
    });
  });

  describe("markReturned", () => {
    it("sets damage fee and returned timestamp", async () => {
      const mock = {
        id: "1",
        shop: "shop",
        sessionId: "sess",
        deposit: 10,
        damageFee: 4,
        returnedAt: "now",
      };
      prismaMock.rentalOrder.update.mockResolvedValue(mock);
      const result = await markReturned("shop", "sess", 4);
      expect(result).toEqual(mock);
      const remaining = (result?.deposit ?? 0) - (result?.damageFee ?? 0);
      expect(remaining).toBe(6);
    });

    it("returns null when order is missing", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("not found"));
      const result = await markReturned("shop", "sess");
      expect(result).toBeNull();
    });
  });

  describe("markRefunded", () => {
    it("records refund timestamp", async () => {
      const mock = {
        id: "1",
        shop: "shop",
        sessionId: "sess",
        refundedAt: "now",
        riskLevel: "medium",
      };
      prismaMock.rentalOrder.update.mockResolvedValue(mock);
      const result = await markRefunded("shop", "sess", "medium", 3, true);
      expect(result).toEqual(mock);
      expect(result?.refundedAt).toBe("now");
    });

    it("returns null when update throws", async () => {
      prismaMock.rentalOrder.update.mockImplementation(() => {
        throw new Error("missing");
      });
      const result = await markRefunded("shop", "sess");
      expect(result).toBeNull();
    });
  });

  describe("updateRisk", () => {
    it("updates risk fields", async () => {
      const mock = {
        id: "1",
        shop: "shop",
        sessionId: "sess",
        riskLevel: "low",
        riskScore: 1,
        flaggedForReview: false,
      };
      prismaMock.rentalOrder.update.mockResolvedValue(mock);
      const result = await updateRisk("shop", "sess", "low", 1, false);
      expect(result).toEqual(mock);
    });

    it("returns null for missing order", async () => {
      prismaMock.rentalOrder.update.mockRejectedValue(new Error("missing"));
      const result = await updateRisk("shop", "sess");
      expect(result).toBeNull();
    });
  });
});

