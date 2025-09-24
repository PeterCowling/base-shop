// packages/ui/src/hooks/__tests__/useTokenColors.test.ts
jest.mock("../../components/cms/ColorInput", () => ({
  getContrast: jest.fn((a: string, b: string) => (a === b ? 1 : 3)),
  suggestContrastColor: jest.fn(() => "#000000"),
}));

import { renderHook } from "@testing-library/react";
import { useTokenColors } from "../useTokenColors";

describe("useTokenColors", () => {
  const tokens: Record<string, string> = {
    "--color-bg-1": "0 0% 100%",
    "--color-fg-1": "0 0% 10%",
    "--color-primary": "220 60% 50%",
    "--color-primary-fg": "0 0% 100%",
  };

  test("pairs bg<->fg tokens by suffix", () => {
    const { result, rerender } = renderHook(({ key, val }) =>
      useTokenColors(key, val, tokens, tokens)
    , { initialProps: { key: "--color-bg-1", val: tokens["--color-bg-1"] } });
    // mocked contrast of different values -> 3 < 4.5, suggest black
    expect(result.current).toEqual({ contrast: 3, suggestion: "#000000" });

    rerender({ key: "--color-primary", val: tokens["--color-primary"] });
    // finds --color-primary-fg in tokens and uses mock contrast 3 < 4.5
    expect(result.current).toEqual({ contrast: 3, suggestion: "#000000" });
  });

  test("returns null when adequate contrast (>= 4.5) is reported", () => {
    // Override mock to simulate adequate contrast
    const mod = require("../../components/cms/ColorInput");
    mod.getContrast.mockReturnValue(5);
    const { result } = renderHook(() =>
      useTokenColors("--color-primary", tokens["--color-primary"], tokens, tokens)
    );
    expect(result.current).toBeNull();
  });
});
