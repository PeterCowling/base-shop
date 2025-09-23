describe("orders/refunds", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("markRefunded updates order and returns normalized result; null on error", async () => {
    const update = jest.fn().mockResolvedValue({ id: "o1" });
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { update } } }));
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2025-01-15T12:00:00Z" }));
    const normalize = jest.fn((o: any) => ({ ...o, normalized: true }));
    jest.doMock("../utils", () => ({ normalize }));

    const mod = require("../refunds") as typeof import("../refunds");
    const res = await mod.markRefunded("shop1", "sess1", "elevated", 55, true);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { shop_sessionId: { shop: "shop1", sessionId: "sess1" } } }));
    expect(res).toEqual({ id: "o1", normalized: true });

    (update as jest.Mock).mockRejectedValueOnce(new Error("db"));
    const res2 = await mod.markRefunded("shop1", "sess1");
    expect(res2).toBeNull();
  });

  test("refundOrder returns null when order missing", async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { findUnique } } }));
    const mod = require("../refunds") as typeof import("../refunds");
    const res = await mod.refundOrder("shop1", "sessX");
    expect(res).toBeNull();
  });

  test("refundOrder processes refund when refundable > 0 and updates totals", async () => {
    const findUnique = jest.fn().mockResolvedValue({ deposit: 100, refundTotal: 20 });
    const update = jest.fn().mockResolvedValue({ id: "o2", refundTotal: 80 });
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { findUnique, update } } }));
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2025-01-15T12:00:00Z" }));
    const normalize = jest.fn((o: any) => ({ ...o, normalized: true }));
    jest.doMock("../utils", () => ({ normalize }));
    const refundsCreate = jest.fn().mockResolvedValue({ id: "re_1" });
    const sessionsRetrieve = jest.fn().mockResolvedValue({ payment_intent: { id: "pi_1" } });
    jest.doMock("@acme/stripe", () => ({
      stripe: { refunds: { create: refundsCreate }, checkout: { sessions: { retrieve: sessionsRetrieve } } },
    }));

    const mod = require("../refunds") as typeof import("../refunds");
    const res = await mod.refundOrder("shop1", "sess1", 70);
    // refundable = min(requested=70, remaining=80) = 70
    expect(sessionsRetrieve).toHaveBeenCalledWith("sess1", { expand: ["payment_intent"] });
    expect(refundsCreate).toHaveBeenCalledWith({ payment_intent: "pi_1", amount: 7000 });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ refundTotal: 90 }) }));
    expect(res).toEqual(expect.objectContaining({ normalized: true }));
  });

  test("refundOrder throws when payment_intent missing on refundable path", async () => {
    const findUnique = jest.fn().mockResolvedValue({ total: 50, refundTotal: 0 });
    const update = jest.fn().mockResolvedValue({ id: "o3" });
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { findUnique, update } } }));
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2025-01-15T12:00:00Z" }));
    const sessionsRetrieve = jest.fn().mockResolvedValue({ payment_intent: null });
    jest.doMock("@acme/stripe", () => ({ stripe: { checkout: { sessions: { retrieve: sessionsRetrieve } }, refunds: { create: jest.fn() } } }));

    const mod = require("../refunds") as typeof import("../refunds");
    await expect(mod.refundOrder("shop1", "sess2", 10)).rejects.toThrow(/payment_intent missing/);
  });

  test("refundOrder updates without calling stripe when refundable = 0", async () => {
    const findUnique = jest.fn().mockResolvedValue({ total: 40, refundTotal: 40 });
    const update = jest.fn().mockResolvedValue({ id: "o4", refundTotal: 40 });
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { findUnique, update } } }));
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2025-01-15T12:00:00Z" }));
    const refundsCreate = jest.fn();
    jest.doMock("@acme/stripe", () => ({ stripe: { refunds: { create: refundsCreate }, checkout: { sessions: { retrieve: jest.fn() } } } }));
    const normalize = jest.fn((o: any) => o);
    jest.doMock("../utils", () => ({ normalize }));

    const mod = require("../refunds") as typeof import("../refunds");
    const res = await mod.refundOrder("shop1", "sess3");
    expect(refundsCreate).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ refundTotal: 40 }) }));
    expect(res).toEqual({ id: "o4", refundTotal: 40 });
  });
});

