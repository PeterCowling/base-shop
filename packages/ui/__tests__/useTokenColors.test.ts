import { renderHook } from "@testing-library/react";
import { useTokenColors } from "../src/hooks/useTokenColors";
import type { TokenMap } from "../src/hooks/useTokenEditor";

jest.mock("../src/components/cms/ColorInput", () => ({
  getContrast: jest.fn(),
  suggestContrastColor: jest.fn(),
}));

import { getContrast, suggestContrastColor } from "../src/components/cms/ColorInput";

const mockGetContrast = getContrast as jest.Mock;
const mockSuggestContrastColor = suggestContrastColor as jest.Mock;

describe("useTokenColors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when contrast is sufficient and updates on value change", () => {
    mockGetContrast.mockReturnValue(5);
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    const tokens = { "--color-fg-primary": "#000" } as TokenMap;
    const { result, rerender } = renderHook(
      ({ value }) =>
        useTokenColors("--color-bg-primary", value, tokens, {} as TokenMap),
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
      { initialProps: { value: "#fff" } }
    );
    expect(result.current).toBeNull();
    expect(mockGetContrast).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    rerender({ value: "#eee" });
    expect(mockGetContrast).toHaveBeenCalledTimes(2);
    expect(result.current).toBeNull();
  });

  it("returns a contrast warning when contrast is low", () => {
    mockGetContrast.mockReturnValue(3);
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    mockSuggestContrastColor.mockReturnValue("#123456");
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    const tokens = { "--color-fg-primary": "#000" } as TokenMap;
    const { result } = renderHook(() =>
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
      useTokenColors("--color-bg-primary", "#111", tokens, {} as TokenMap)
    );
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    expect(result.current).toEqual({ contrast: 3, suggestion: "#123456" });
  });

  it("pairs --color-fg* tokens with their --color-bg* counterparts", () => {
    mockGetContrast.mockReturnValue(5);
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    const tokens = { "--color-bg-secondary": "#fff" } as TokenMap;
    const { result } = renderHook(() =>
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
      useTokenColors("--color-fg-secondary", "#000", tokens, {} as TokenMap)
    );
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    expect(mockGetContrast).toHaveBeenCalledWith("#000", "#fff");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("pairs *-fg tokens with their base keys", () => {
    mockGetContrast.mockReturnValue(5);
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    const tokens = { "--brand": "#fff" } as TokenMap;
    const { result } = renderHook(() =>
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
      useTokenColors("--brand-fg", "#000", tokens, {} as TokenMap)
    );
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    expect(mockGetContrast).toHaveBeenCalledWith("#000", "#fff");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("finds *-fg candidates in token maps", () => {
    mockGetContrast.mockReturnValue(5);
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    const baseTokens = { "--accent-fg": "#000" } as TokenMap;
    const { result } = renderHook(() =>
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
      useTokenColors("--accent", "#fff", {} as TokenMap, baseTokens)
    );
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    expect(mockGetContrast).toHaveBeenCalledWith("#fff", "#000");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("returns a warning with null suggestion when contrast is low", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue(null);
    // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
    const tokens = { "--color-fg-primary": "#000" } as TokenMap;
    const { result } = renderHook(() =>
      // eslint-disable-next-line ds/no-raw-color -- TEST-123: test fixture literal
      useTokenColors("--color-bg-primary", "#111", tokens, {} as TokenMap)
    );
    expect(result.current).toEqual({ contrast: 3, suggestion: null });
  });
});
