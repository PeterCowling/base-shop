const { describe, it, expect } = require("@jest/globals");
const { cn } = require("../utils/cn.ts");

describe("cn", () => {
  it("filters truthy classes", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});
