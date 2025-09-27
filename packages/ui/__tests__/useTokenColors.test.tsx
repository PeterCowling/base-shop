import { renderHook } from "@testing-library/react";
import { useTokenColors } from "../src/hooks/useTokenColors";

describe("useTokenColors token pairing and contrast", () => {
  it("pairs fg/bg tokens and computes contrast issue", () => {
    const tokens = {
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
      "--color-bg": "#ffffff",
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
      "--color-bg-fg": "#000000",
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
      "--color-muted": "#cccccc",
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
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
