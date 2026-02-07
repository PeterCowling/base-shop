import { getAllocationType } from "../Tooltip";

describe("getAllocationType", () => {
  // Logic under test sourced from Tooltip.tsx lines 34–51
  it("returns same-grade when booked and allocated match", () => {
    expect(getAllocationType("1", "1")).toBe("same-grade");
  });

  it("returns side-grade for predefined side grade pairs", () => {
    expect(getAllocationType("5", "6")).toBe("side-grade");
    expect(getAllocationType(3, 4)).toBe("side-grade");
  });

  it("returns upgrade when not same-grade or side-grade", () => {
    expect(getAllocationType("1", "2")).toBe("upgrade");
  });
});
