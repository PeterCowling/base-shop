import { snapToGrid } from "../gridSnap";

describe("snapToGrid", () => {
  it("rounds to nearest grid unit", () => {
    expect(snapToGrid(0, 10)).toBe(0);
    expect(snapToGrid(14, 10)).toBe(10);
    expect(snapToGrid(15, 10)).toBe(20);
    expect(snapToGrid(25, 8)).toBe(24);
  });
});

