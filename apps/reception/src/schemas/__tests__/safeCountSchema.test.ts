import "@testing-library/jest-dom";

import type { SafeCount } from "../safeCountSchema";
import { safeCountSchema } from "../safeCountSchema";

const baseData = {
  user: "u",
  timestamp: "2024-01-01T00:00:00.000Z",
};

describe("safeCountSchema", () => {
  it("accepts valid enum values", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "deposit",
      denomBreakdown: { "100": 1 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts exchange breakdown object", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "exchange",
      amount: 5,
      direction: "drawerToSafe",
      denomBreakdown: {
        incoming: { "50": 1 },
        outgoing: { "20": 2 },
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts safeReset entries", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "safeReset",
      count: 100,
      keycardCount: 2,
      denomBreakdown: { "50": 2 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid enum value", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "invalid" as unknown as SafeCount["type"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects incorrect union type", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "deposit",
      denomBreakdown: "bad" as unknown as SafeCount["denomBreakdown"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects exchange breakdown with non-numeric values", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "exchange",
      amount: 5,
      direction: "drawerToSafe",
      denomBreakdown: {
        incoming: { "50": "1" as unknown as number },
        outgoing: { "20": 2 },
      },
    });
    expect(result.success).toBe(false);
  });

  it("requires amount for exchange", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "exchange",
      direction: "drawerToSafe",
      denomBreakdown: {
        incoming: { "5": 1 },
        outgoing: { "5": 1 },
      },
    });
    expect(result.success).toBe(false);
  });

  it("requires direction for exchange", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "exchange",
      amount: 5,
      denomBreakdown: {
        incoming: { "5": 1 },
        outgoing: { "5": 1 },
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts keycard fields", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "safeReconcile",
      keycardCount: 5,
      keycardDifference: 1,
    });
    expect(result.success).toBe(true);
  });

  it("allows keycard fields for deposits", () => {
    const result = safeCountSchema.safeParse({
      ...baseData,
      type: "bankDeposit",
      amount: 100,
      keycardCount: 2,
      keycardDifference: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-positive amount", () => {
    const zero = safeCountSchema.safeParse({
      ...baseData,
      type: "deposit",
      amount: 0,
    });
    expect(zero.success).toBe(false);

    const negative = safeCountSchema.safeParse({
      ...baseData,
      type: "deposit",
      amount: -5,
    });
    expect(negative.success).toBe(false);
  });
});
