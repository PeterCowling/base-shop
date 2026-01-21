
import "@testing-library/jest-dom";
import { calculateDiscrepancy } from "../cashUtils";

describe("calculateDiscrepancy", () => {
  it("computes the difference between counted and expected", () => {
    expect(calculateDiscrepancy(10, 8)).toBe(2);
    expect(calculateDiscrepancy(10, 9)).toBe(1);
    expect(calculateDiscrepancy(5, 10)).toBe(-5);
  });
});
