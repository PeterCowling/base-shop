import { renderHook } from "@testing-library/react";

import { getContrast, suggestContrastColor } from "../src/components/cms/ColorInput";
import { useTokenColors } from "../src/hooks/useTokenColors";
import type { TokenMap } from "../src/hooks/useTokenEditor";

jest.mock("../src/components/cms/ColorInput", () => ({
  getContrast: jest.fn(),
  suggestContrastColor: jest.fn(),
}));

const mockGetContrast = getContrast as jest.Mock;
const mockSuggestContrastColor = suggestContrastColor as jest.Mock;

describe("useTokenColors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when contrast is sufficient and updates on value change", () => {
    mockGetContrast.mockReturnValue(5);
     
    const tokens = { "--color-fg-primary": "#000" } as TokenMap;
    const { result, rerender } = renderHook(
      ({ value }) =>
        useTokenColors("--color-bg-primary", value, tokens, {} as TokenMap),
       
      { initialProps: { value: "#fff" } }
    );
    expect(result.current).toBeNull();
    expect(mockGetContrast).toHaveBeenCalledTimes(1);
     
    rerender({ value: "#eee" });
    expect(mockGetContrast).toHaveBeenCalledTimes(2);
    expect(result.current).toBeNull();
  });

  it("returns a contrast warning when contrast is low", () => {
    mockGetContrast.mockReturnValue(3);
     
    mockSuggestContrastColor.mockReturnValue("#123456");
     
    const tokens = { "--color-fg-primary": "#000" } as TokenMap;
    const { result } = renderHook(() =>
       
      useTokenColors("--color-bg-primary", "#111", tokens, {} as TokenMap)
    );
     
    expect(result.current).toEqual({ contrast: 3, suggestion: "#123456" });
  });

  it("pairs --color-fg* tokens with their --color-bg* counterparts", () => {
    mockGetContrast.mockReturnValue(5);
     
    const tokens = { "--color-bg-secondary": "#fff" } as TokenMap;
    const { result } = renderHook(() =>
       
      useTokenColors("--color-fg-secondary", "#000", tokens, {} as TokenMap)
    );
     
    expect(mockGetContrast).toHaveBeenCalledWith("#000", "#fff");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("pairs *-fg tokens with their base keys", () => {
    mockGetContrast.mockReturnValue(5);
     
    const tokens = { "--brand": "#fff" } as TokenMap;
    const { result } = renderHook(() =>
       
      useTokenColors("--brand-fg", "#000", tokens, {} as TokenMap)
    );
     
    expect(mockGetContrast).toHaveBeenCalledWith("#000", "#fff");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("finds *-fg candidates in token maps", () => {
    mockGetContrast.mockReturnValue(5);
     
    const baseTokens = { "--accent-fg": "#000" } as TokenMap;
    const { result } = renderHook(() =>
       
      useTokenColors("--accent", "#fff", {} as TokenMap, baseTokens)
    );
     
    expect(mockGetContrast).toHaveBeenCalledWith("#fff", "#000");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("returns a warning with null suggestion when contrast is low", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue(null);
     
    const tokens = { "--color-fg-primary": "#000" } as TokenMap;
    const { result } = renderHook(() =>
       
      useTokenColors("--color-bg-primary", "#111", tokens, {} as TokenMap)
    );
    expect(result.current).toEqual({ contrast: 3, suggestion: null });
  });
});
