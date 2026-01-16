import { describe, expect, it } from "vitest";
import { financialsRoomSchema } from "../financialsRoomSchema";

describe("financialsRoomSchema", () => {
  it("defaults numeric fields to zero when omitted", () => {
    const parsed = financialsRoomSchema.parse({
      roomA: {},
    });
    expect(parsed.roomA.balance).toBe(0);
    expect(parsed.roomA.totalDue).toBe(0);
    expect(parsed.roomA.totalPaid).toBe(0);
    expect(parsed.roomA.totalAdjust).toBe(0);
    expect(parsed.roomA.transactions).toEqual({});
  });

  it("throws for invalid transaction structures", () => {
    expect(() =>
      financialsRoomSchema.parse({
        roomA: {
          transactions: {
            tx1: {
              amount: 100,
            },
          },
        },
      })
    ).toThrow();
  });
});
