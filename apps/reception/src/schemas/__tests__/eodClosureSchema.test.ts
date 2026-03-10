import { eodClosureSchema } from "../eodClosureSchema";

const basePayload = {
  date: "2026-02-28",
  timestamp: "2026-02-28T22:00:00.000+01:00",
  confirmedBy: "pete",
};

describe("eodClosureSchema", () => {
  it("TC-01: valid full payload with cashVariance and stockItemsCounted → safeParse succeeds", () => {
    const result = eodClosureSchema.safeParse({
      ...basePayload,
      cashVariance: -3.5,
      stockItemsCounted: 12,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cashVariance).toBe(-3.5);
      expect(result.data.stockItemsCounted).toBe(12);
    }
  });

  it("TC-02: payload without new fields → safeParse succeeds (backward compat)", () => {
    const result = eodClosureSchema.safeParse(basePayload);
    expect(result.success).toBe(true);
  });

  it("TC-03: cashVariance is a string → safeParse fails", () => {
    const result = eodClosureSchema.safeParse({
      ...basePayload,
      cashVariance: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("TC-04: stockItemsCounted is a non-integer → safeParse fails", () => {
    const result = eodClosureSchema.safeParse({
      ...basePayload,
      stockItemsCounted: 3.7,
    });
    expect(result.success).toBe(false);
  });
});
