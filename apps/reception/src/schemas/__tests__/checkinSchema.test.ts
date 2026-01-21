
import "@testing-library/jest-dom";
import { checkinDataSchema, checkinsSchema } from "../checkinSchema";

// Test suite for the schemas modelling the "checkins" node

describe("checkinSchema", () => {
  it("parses a valid record map", () => {
    const data = {
      occ1: { reservationCode: "res1", timestamp: "2024-01-01T08:00:00.000Z" },
      occ2: { reservationCode: "res2" },
    };

    expect(() => checkinDataSchema.parse(data)).not.toThrow();
  });

  it("fails with invalid record values", () => {
    const bad = {
      occ1: { reservationCode: 123 },
    } as unknown;

    expect(() => checkinDataSchema.parse(bad)).toThrow();
  });

  it("fails when nesting is incorrect", () => {
    const wrong = {
      "2024-02-20": {
        occ1: "not-an-object",
      },
    } as unknown;

    expect(() => checkinsSchema.parse(wrong)).toThrow();
  });
});
