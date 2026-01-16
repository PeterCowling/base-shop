import { describe, expect, it } from "vitest";

import { tillRecordSchema } from "../tillRecordSchema";

describe("tillRecordSchema", () => {
  it("parses when optional fields are provided", () => {
    const result = tillRecordSchema.safeParse({
      amount: 12,
      date: "2024-01-02",
      note: "open",
    });
    expect(result.success).toBe(true);
  });

  it("fails when amount is not a number", () => {
    const result = tillRecordSchema.safeParse({ amount: "twelve" });
    expect(result.success).toBe(false);
  });

  it("fails when unknown properties are present", () => {
    const result = tillRecordSchema.safeParse({ amount: 5, foo: "bar" });
    expect(result.success).toBe(false);
  });
});
