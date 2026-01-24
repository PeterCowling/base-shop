import { cn } from "../cn";

describe("cn", () => {
  it("filters out falsey values", () => {
    expect(cn("a", "", false, null as unknown as string, undefined, "b")).toBe("a b");
  });

  it("returns empty string with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("dedupes design-token color utilities with later overrides", () => {
    const merged = cn("bg-primary text-primary-foreground", "bg-foreground text-background");
    expect(merged).toContain("bg-foreground");
    expect(merged).toContain("text-background");
    expect(merged).not.toContain("bg-primary");
    expect(merged).not.toContain("text-primary-foreground");
  });
});
