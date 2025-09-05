import { computeAvailability } from "@acme/platform-core/utils/inventory";

describe("computeAvailability", () => {
  it("reports in stock when quantity is available", () => {
    const res = computeAvailability(5, 1, 1);
    expect(res).toEqual({ reserved: 1, available: 4, canFulfill: true });
  });

  it("reports backorder when quantity is zero but backorder allowed", () => {
    const res = computeAvailability(0, 0, 1, true);
    expect(res).toEqual({ reserved: 0, available: 0, canFulfill: true });
  });

  it("reports out of stock when quantity is zero and backorder disabled", () => {
    const res = computeAvailability(0, 0, 1, false);
    expect(res).toEqual({ reserved: 0, available: 0, canFulfill: false });
  });

  it("handles oversell protection vs allowed", () => {
    expect(computeAvailability(5, 5, 1, false).canFulfill).toBe(false);
    expect(computeAvailability(5, 5, 1, true).canFulfill).toBe(true);
  });
});
