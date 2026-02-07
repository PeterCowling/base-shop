
import "@testing-library/jest-dom";

import { cashCountSchema } from "../cashCountSchema";

const baseData = {
  user: "123",
  timestamp: "2024-01-01T00:00:00Z",
};

describe("cashCountSchema", () => {
  it("accepts all valid type values", () => {
    const validTypes = [
      "opening",
      "close",
      "reconcile",
      "float",
      "tenderRemoval",
    ] as const;

    for (const type of validTypes) {
      const result = cashCountSchema.safeParse({ ...baseData, type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid enum entries", () => {
    const result = cashCountSchema.safeParse({
      ...baseData,
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("fails for wrong field types", () => {
    const result = cashCountSchema.safeParse({
      user: 1 as unknown as string,
      timestamp: "time",
      type: "opening",
      count: "five" as unknown as number,
    });
    expect(result.success).toBe(false);
  });

  it("allows optional keycardCount", () => {
    const result = cashCountSchema.safeParse({
      ...baseData,
      type: "close",
      keycardCount: 3,
    });
    expect(result.success).toBe(true);
  });

  it("allows optional denomBreakdown", () => {
    const result = cashCountSchema.safeParse({
      ...baseData,
      type: "opening",
      denomBreakdown: { "50": 2, "20": 1 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid denomBreakdown entries", () => {
    const result = cashCountSchema.safeParse({
      ...baseData,
      type: "opening",
      denomBreakdown: { "50": "two" } as unknown as Record<string, number>,
    });
    expect(result.success).toBe(false);
  });
});
