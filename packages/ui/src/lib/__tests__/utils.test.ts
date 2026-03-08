import { cn } from "../utils";

describe("cn shim", () => {
  it("re-exports cn from utils/style/cn", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
  it("handles custom theme tokens", () => {
    expect(cn("bg-primary", "bg-accent")).toBe("bg-accent");
  });
});
