import { boxProps, cn, cssVars } from "../index";

describe("style index barrel", () => {
  it("re-exports core style helpers", () => {
    expect(typeof boxProps).toBe("function");
    expect(typeof cn).toBe("function");
    expect(typeof cssVars).toBe("function");
  });
});
