import { overflowContainmentClass } from "../overflowContainment";

describe("overflowContainmentClass", () => {
  it("returns classes for all supported variants", () => {
    expect(overflowContainmentClass("dialogContent")).toBe("overflow-x-hidden");
    expect(overflowContainmentClass("menuSurface")).toBe("overflow-hidden");
    expect(overflowContainmentClass("popoverSurface")).toBe("overflow-hidden");
    expect(overflowContainmentClass("comboboxSurface")).toBe("overflow-hidden");
    expect(overflowContainmentClass("tooltipSurface")).toBe("overflow-hidden");
    expect(overflowContainmentClass("inlineNoticeSurface")).toBe("overflow-hidden");
  });
});
