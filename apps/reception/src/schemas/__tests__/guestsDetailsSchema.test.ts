import { describe, expect, it } from "vitest";

import { guestsDetailsSchema } from "../guestsDetailsSchema";

describe("guestsDetailsSchema", () => {
  it("parses valid nested occupant details", () => {
    const result = guestsDetailsSchema.safeParse({
      BR123: {
        occ1: {
          firstName: "John",
          lastName: "Doe",
          allocated: "10",
          dateOfBirth: { yyyy: "1990", mm: "05", dd: "15" },
        },
        occ2: {
          firstName: "Jane",
          lastName: "Smith",
          allocated: "7",
          dateOfBirth: { yyyy: "2000", mm: "08", dd: "01" },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("fails with invalid nested structures", () => {
    const result = guestsDetailsSchema.safeParse({
      BR123: {
        occ1: "not an object",
        occ2: {
          dateOfBirth: { yyyy: "1990", mm: "13", dd: "15" },
        },
      },
    });
    expect(result.success).toBe(false);
  });
});
