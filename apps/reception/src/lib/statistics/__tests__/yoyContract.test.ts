import {
  aggregateMonthlyRevenue,
  buildYoYProvenance,
  includeTransactionByMode,
  monthKeyUtc,
  sanitizeRevenueMode,
  sanitizeYoYYear,
  ytdSum,
} from "../yoyContract";

describe("yoyContract", () => {
  it("uses UTC month boundaries", () => {
    expect(monthKeyUtc("2026-01-31T23:30:00-02:00")).toBe("2026-02");
  });

  it("excludes voided transactions and bar transactions from room-only mode", () => {
    expect(
      includeTransactionByMode(
        { type: "barSale", itemCategory: "beer", voidedAt: undefined },
        "room-only",
      ),
    ).toBe(false);
    expect(
      includeTransactionByMode(
        { type: "roomPayment", itemCategory: "room", voidedAt: "2026-01-05T00:00:00Z" },
        "room-plus-bar",
      ),
    ).toBe(false);
  });

  it("aggregates only eligible transactions for the requested year", () => {
    const monthly = aggregateMonthlyRevenue(
      {
        room: {
          amount: 100,
          bookingRef: "A",
          count: 1,
          description: "Room",
          itemCategory: "room",
          method: "card",
          occupantId: "1",
          timestamp: "2026-01-10T12:00:00Z",
          type: "roomPayment",
          user_name: "Test",
        },
        bar: {
          amount: 20,
          bookingRef: "B",
          count: 1,
          description: "Beer",
          itemCategory: "beer",
          method: "card",
          occupantId: "2",
          timestamp: "2026-01-11T12:00:00Z",
          type: "barSale",
          user_name: "Test",
        },
        old: {
          amount: 50,
          bookingRef: "C",
          count: 1,
          description: "Old",
          itemCategory: "room",
          method: "card",
          occupantId: "3",
          timestamp: "2025-01-11T12:00:00Z",
          type: "roomPayment",
          user_name: "Test",
        },
      },
      2026,
      "room-only",
    );

    expect(monthly["2026-01"]).toBe(100);
    expect(monthly["2026-02"]).toBe(0);
  });

  it("limits YTD sum to the current UTC month for the active year", () => {
    expect(
      ytdSum(
        {
          "2026-01": 10,
          "2026-02": 20,
          "2026-03": 30,
          "2026-04": 40,
        },
        2026,
        new Date("2026-03-15T12:00:00Z"),
      ),
    ).toBe(60);
  });

  it("builds provenance with archive fallback metadata", () => {
    const provenance = buildYoYProvenance({
      currentTransactions: {},
      previousTransactions: {},
      hasDedicatedArchiveDb: false,
    });

    expect(provenance.currentSource.path).toBe("allFinancialTransactions");
    expect(provenance.previousSource.path).toBe("archive/allFinancialTransactions");
    expect(provenance.previousSource.fallbackUsed).toBe(true);
    expect(provenance.previousSource.sourceKind).toBe("archive-mirror");
  });

  it("sanitizes request parameters to contract-safe values", () => {
    expect(sanitizeRevenueMode("room-only")).toBe("room-only");
    expect(sanitizeRevenueMode("anything-else")).toBe("room-plus-bar");
    expect(sanitizeYoYYear("2010", new Date("2026-03-09T00:00:00Z"))).toBe(2026);
    expect(sanitizeYoYYear("2025", new Date("2026-03-09T00:00:00Z"))).toBe(2025);
  });
});
