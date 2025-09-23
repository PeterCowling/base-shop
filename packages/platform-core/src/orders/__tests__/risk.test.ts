describe("orders/risk repository helpers", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("markNeedsAttention sets flaggedForReview and normalizes result", async () => {
    const update = jest.fn().mockResolvedValue({ id: "o1", flaggedForReview: true });
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { update } } }));
    const normalize = jest.fn((o: any) => ({ ...o, normalized: true }));
    jest.doMock("../utils", () => ({ normalize }));

    const mod = require("../risk") as typeof import("../risk");
    const res = await mod.markNeedsAttention("shop1", "sess1");
    expect(update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop: "shop1", sessionId: "sess1" } },
      data: { flaggedForReview: true },
    });
    expect(normalize).toHaveBeenCalledWith({ id: "o1", flaggedForReview: true });
    expect(res).toEqual({ id: "o1", flaggedForReview: true, normalized: true });
  });

  test("markNeedsAttention returns null on prisma error", async () => {
    const update = jest.fn().mockRejectedValue(new Error("db"));
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { update } } }));
    const mod = require("../risk") as typeof import("../risk");
    const res = await mod.markNeedsAttention("shop1", "sess1");
    expect(res).toBeNull();
  });

  test("updateRisk forwards only provided fields and normalizes result", async () => {
    const update = jest.fn().mockResolvedValue({ id: "o2", riskLevel: "elevated", riskScore: 55, flaggedForReview: true });
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { update } } }));
    const normalize = jest.fn((o: any) => ({ ...o, normalized: true }));
    jest.doMock("../utils", () => ({ normalize }));

    const mod = require("../risk") as typeof import("../risk");
    const res = await mod.updateRisk("shop2", "sess2", "elevated", 55, true);
    expect(update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop: "shop2", sessionId: "sess2" } },
      data: { riskLevel: "elevated", riskScore: 55, flaggedForReview: true },
    });
    expect(res).toEqual({ id: "o2", riskLevel: "elevated", riskScore: 55, flaggedForReview: true, normalized: true });
  });

  test("updateRisk returns null on prisma error", async () => {
    const update = jest.fn().mockRejectedValue(new Error("db"));
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { update } } }));
    const mod = require("../risk") as typeof import("../risk");
    const res = await mod.updateRisk("shopX", "sessX");
    expect(res).toBeNull();
  });
});

