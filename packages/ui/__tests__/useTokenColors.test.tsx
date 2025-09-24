import { renderHook } from "@testing-library/react";
import { useTokenColors } from "../src/hooks/useTokenColors";

describe("useTokenColors token pairing and contrast", () => {
  it("pairs fg/bg tokens and computes contrast issue", () => {
    const tokens = {
      "--color-bg": "#ffffff",
      "--color-bg-fg": "#000000",
      "--color-muted": "#cccccc",
      "--color-muted-fg": "#bbbbbb",
    } as Record<string, string>;
    const base: Record<string, string> = {};
    const hook1 = renderHook(() =>
      useTokenColors("--color-bg", tokens["--color-bg"], tokens as any, base as any)
    );
    expect(hook1.result.current).toBeNull(); // good contrast

    const hook2 = renderHook(() =>
      useTokenColors("--color-muted", tokens["--color-muted"], tokens as any, base as any)
    );
    expect(hook2.result.current).not.toBeNull();
    expect(hook2.result.current).toHaveProperty("contrast");
  });
});
