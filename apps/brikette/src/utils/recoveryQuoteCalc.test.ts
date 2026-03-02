import { buildQuoteIdempotencyKey, buildRecoveryQuote } from "./recoveryQuoteCalc";

jest.mock("@/data/indicative_prices.json", () => ({
  last_updated: "2026-03-01",
  currency: "EUR",
  basis: "from_per_night",
  stale_after_days: 14,
  rooms: {
    room_10: { from: 80 },
    double_room: { from: 129 },
  },
}));

const BASE_CONTEXT = {
  checkin: "2026-06-01",
  checkout: "2026-06-03",
  pax: 1,
  source_route: "/book",
};

describe("buildRecoveryQuote", () => {
  it("TC-01-01: returns indicative price for known room_id over 2 nights", () => {
    const result = buildRecoveryQuote({ ...BASE_CONTEXT, room_id: "room_10" });
    expect(result.mode).toBe("from_price");
    expect(result.nights).toBe(2);
    expect(result.pricePerNight).toBe(80);
    expect(result.totalFrom).toBe(160);
    expect(result.priceSource).toBe("indicative");
    expect(result.currency).toBe("EUR");
  });

  it("TC-01-02: returns priceSource=none for unknown room_id", () => {
    const result = buildRecoveryQuote({ ...BASE_CONTEXT, room_id: "room_99" });
    expect(result.pricePerNight).toBeNull();
    expect(result.totalFrom).toBeNull();
    expect(result.priceSource).toBe("none");
  });

  it("TC-01-05: returns priceSource=none when room_id is absent", () => {
    const result = buildRecoveryQuote({ ...BASE_CONTEXT });
    expect(result.pricePerNight).toBeNull();
    expect(result.totalFrom).toBeNull();
    expect(result.priceSource).toBe("none");
  });

  it("TC-01-06: returns totalFrom=null when nights=0 (checkin equals checkout)", () => {
    const result = buildRecoveryQuote({
      ...BASE_CONTEXT,
      checkin: "2026-06-01",
      checkout: "2026-06-01",
      room_id: "room_10",
    });
    expect(result.nights).toBe(0);
    expect(result.totalFrom).toBeNull();
    expect(result.pricePerNight).toBe(80);
    expect(result.priceSource).toBe("indicative");
  });

  it("TC-01-07: double_room returns correct price for 1 night", () => {
    const result = buildRecoveryQuote({
      ...BASE_CONTEXT,
      checkin: "2026-06-01",
      checkout: "2026-06-02",
      room_id: "double_room",
    });
    expect(result.pricePerNight).toBe(129);
    expect(result.totalFrom).toBe(129);
    expect(result.priceSource).toBe("indicative");
  });
});

describe("buildQuoteIdempotencyKey", () => {
  it("TC-01-03: returns identical string on two calls with same inputs", () => {
    const ctx = { ...BASE_CONTEXT, room_id: "room_10", rate_plan: "nr" as const };
    const key1 = buildQuoteIdempotencyKey(ctx);
    const key2 = buildQuoteIdempotencyKey(ctx);
    expect(key1).toBe(key2);
    expect(key1).toContain("rq:");
  });

  it("TC-01-04: produces different key when checkin differs by 1 day", () => {
    const ctx1 = { ...BASE_CONTEXT, room_id: "room_10" };
    const ctx2 = { ...BASE_CONTEXT, checkin: "2026-06-02", room_id: "room_10" };
    expect(buildQuoteIdempotencyKey(ctx1)).not.toBe(buildQuoteIdempotencyKey(ctx2));
  });

  it("keys differ when rate_plan differs", () => {
    const ctx1 = { ...BASE_CONTEXT, room_id: "room_10", rate_plan: "nr" as const };
    const ctx2 = { ...BASE_CONTEXT, room_id: "room_10", rate_plan: "flex" as const };
    expect(buildQuoteIdempotencyKey(ctx1)).not.toBe(buildQuoteIdempotencyKey(ctx2));
  });
});
