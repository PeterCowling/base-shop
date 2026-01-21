
import "@testing-library/jest-dom";
import { cashDiscrepancySchema } from "../cashDiscrepancySchema";

describe("cashDiscrepancySchema", () => {
  it("validates a simple record", () => {
    expect(() =>
      cashDiscrepancySchema.parse({
        user: "alice",
        timestamp: "2024-01-01T00:00:00Z",
        amount: 100,
      })
    ).not.toThrow();
  });

  it("fails when amount is not numeric", () => {
    expect(() =>
      cashDiscrepancySchema.parse({
        user: "alice",
        timestamp: "2024-01-01T00:00:00Z",
        amount: "not-a-number",
      })
    ).toThrow();
  });
});
