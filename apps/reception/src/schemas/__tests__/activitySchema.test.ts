import { describe, expect, it } from "vitest";

import { activitySchema } from "../activitySchema";

describe("activitySchema", () => {
  it("passes with code and who", () => {
    const result = activitySchema.safeParse({ code: 1, who: "alice" });
    expect(result.success).toBe(true);
  });

  it("fails when code is missing", () => {
    const result = activitySchema.safeParse({ who: "bob" });
    expect(result.success).toBe(false);
  });

  it("fails when who is missing", () => {
    const result = activitySchema.safeParse({ code: 2 });
    expect(result.success).toBe(false);
  });

  it("fails when types mismatch", () => {
    expect(activitySchema.safeParse({ code: "3", who: "carol" }).success).toBe(
      false
    );
    expect(activitySchema.safeParse({ code: 4, who: 123 }).success).toBe(false);
  });
});
