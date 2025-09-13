/** @jest-environment node */

import { markNeedsAttention, updateRisk } from "../orders/risk";

jest.mock("../db", () => ({
  prisma: {
    rentalOrder: { update: jest.fn() },
  },
}));

const { prisma } = jest.requireMock("../db") as {
  prisma: { rentalOrder: { update: jest.Mock } };
};

describe("orders/risk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("markNeedsAttention", () => {
    it("returns null on update error", async () => {
      prisma.rentalOrder.update.mockRejectedValue(new Error("update failed"));
      const result = await markNeedsAttention("shop", "sess");
      expect(result).toBeNull();
    });

    it("returns normalized order on success", async () => {
      prisma.rentalOrder.update.mockResolvedValue({
        id: "1",
        flaggedForReview: true,
        riskLevel: null,
      });
      const result = await markNeedsAttention("shop", "sess");
      expect(result).toEqual({
        id: "1",
        flaggedForReview: true,
        riskLevel: undefined,
      });
    });
  });

  describe("updateRisk", () => {
    it("returns null on update error", async () => {
      prisma.rentalOrder.update.mockRejectedValue(new Error("update failed"));
      const result = await updateRisk("shop", "sess");
      expect(result).toBeNull();
    });

    it("returns null when update returns null", async () => {
      prisma.rentalOrder.update.mockResolvedValue(null);
      const result = await updateRisk("shop", "sess");
      expect(result).toBeNull();
    });

    it.each([
      [{ riskLevel: "low" }, "low", undefined, undefined],
      [{ riskScore: 5 }, undefined, 5, undefined],
      [{ flaggedForReview: true }, undefined, undefined, true],
      [{ flaggedForReview: false }, undefined, undefined, false],
      [{ riskLevel: "low", riskScore: 5 }, "low", 5, undefined],
      [{ riskLevel: "low", flaggedForReview: true }, "low", undefined, true],
      [{ riskScore: 5, flaggedForReview: false }, undefined, 5, false],
      [{ riskLevel: "low", riskScore: 5, flaggedForReview: true }, "low", 5, true],
    ])("updates only provided fields %j", async (data, riskLevel, riskScore, flaggedForReview) => {
      prisma.rentalOrder.update.mockResolvedValue({});
      await updateRisk("shop", "sess", riskLevel, riskScore, flaggedForReview);
      expect(prisma.rentalOrder.update).toHaveBeenCalledWith({
        where: { shop_sessionId: { shop: "shop", sessionId: "sess" } },
        data,
      });
    });

    it("returns updated order with provided fields", async () => {
      prisma.rentalOrder.update.mockResolvedValue({
        riskLevel: "high",
        riskScore: 7,
        flaggedForReview: true,
      });
      const result = await updateRisk("shop", "sess", "high", 7, true);
      expect(result).toEqual({
        riskLevel: "high",
        riskScore: 7,
        flaggedForReview: true,
      });
    });
  });
});

