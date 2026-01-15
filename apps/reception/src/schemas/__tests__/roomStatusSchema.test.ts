import { describe, expect, it } from "vitest";

import { singleRoomStatusSchema } from "../roomStatusSchema";

describe("singleRoomStatusSchema", () => {
  it("accepts string or false for each field", () => {
    expect(() =>
      singleRoomStatusSchema.parse({
        checkedout: "2024-01-01",
        clean: "Yes",
        cleaned: "2024-01-02",
      })
    ).not.toThrow();

    expect(() =>
      singleRoomStatusSchema.parse({
        checkedout: false,
        clean: false,
        cleaned: false,
      })
    ).not.toThrow();
  });

  it("rejects unexpected value types", () => {
    expect(() => singleRoomStatusSchema.parse({ checkedout: true })).toThrow();
    expect(() => singleRoomStatusSchema.parse({ clean: 1 })).toThrow();
    expect(() => singleRoomStatusSchema.parse({ cleaned: {} })).toThrow();
  });

  it("fails when extra keys are present", () => {
    const result = singleRoomStatusSchema.safeParse({ foo: "bar" });
    expect(result.success).toBe(false);
  });
});
