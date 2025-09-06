import { cn } from "../cn";

describe("cn", () => {
  it("filters out falsey values", () => {
    expect(cn("a", "", false, null as unknown as string, undefined, "b")).toBe("a b");
  });

  it("returns empty string with no arguments", () => {
    expect(cn()).toBe("");
  });
});
