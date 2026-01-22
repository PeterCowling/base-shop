
import "@testing-library/jest-dom";

import { mealPlanSchema } from "../mealPlanSchema";

describe("mealPlanSchema", () => {
  it("parses provided optional fields", () => {
    const result = mealPlanSchema.safeParse({ level: "full", type: "buffet" });
    expect(result.success).toBe(true);
  });

  it("fails when unknown properties are present", () => {
    const result = mealPlanSchema.safeParse({ level: "basic", extra: true });
    expect(result.success).toBe(false);
  });
});
