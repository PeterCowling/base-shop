import { describe, expect, it } from "vitest";

import { ccDataSchema } from "../ccDataSchema";

describe("ccDataSchema", () => {
  it("parses nested credit-card records", () => {
    const result = ccDataSchema.safeParse({
      booking1: {
        card1: { ccNum: "4111111111111111", expDate: "12/30" },
        card2: { ccNum: "4242424242424242", expDate: "01/25" },
      },
      booking2: {
        card3: { ccNum: "4012888888881881", expDate: "11/22" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("errors when ccNum is missing", () => {
    const result = ccDataSchema.safeParse({
      booking1: {
        card1: { expDate: "12/30" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("errors when expDate is missing", () => {
    const result = ccDataSchema.safeParse({
      booking1: {
        card1: { ccNum: "4111111111111111" },
      },
    });
    expect(result.success).toBe(false);
  });
});
