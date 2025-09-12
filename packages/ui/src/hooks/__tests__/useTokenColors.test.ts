import { renderHook } from "@testing-library/react";
import { useTokenColors } from "../useTokenColors";
import type { TokenMap } from "../useTokenEditor";

jest.mock("../../components/cms/ColorInput", () => ({
  getContrast: jest.fn(),
  suggestContrastColor: jest.fn(),
}));

import {
  getContrast,
  suggestContrastColor,
} from "../../components/cms/ColorInput";

const mockGetContrast =
  getContrast as jest.MockedFunction<typeof getContrast>;
const mockSuggestContrastColor =
  suggestContrastColor as jest.MockedFunction<typeof suggestContrastColor>;

describe("useTokenColors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("pairs --color-bg* with --color-fg*", () => {
    mockGetContrast.mockReturnValue(5);
    const tokens = {
      "--color-fg-primary": "#000000",
    } as unknown as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--color-bg-primary", "#ffffff", tokens, {} as TokenMap)
    );
    expect(mockGetContrast).toHaveBeenCalledWith("#ffffff", "#000000");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("returns null when contrast meets threshold", () => {
    mockGetContrast.mockReturnValue(4.5);
    const tokens = {
      "--color-fg-primary": "#000000",
    } as unknown as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--color-bg-primary", "#ffffff", tokens, {} as TokenMap)
    );
    expect(mockGetContrast).toHaveBeenCalledWith("#ffffff", "#000000");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("pairs --color-fg* with --color-bg*", () => {
    mockGetContrast.mockReturnValue(5);
    const tokens = {
      "--color-bg-secondary": "#ffffff",
    } as unknown as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--color-fg-secondary", "#000000", tokens, {} as TokenMap)
    );
    expect(mockGetContrast).toHaveBeenCalledWith("#000000", "#ffffff");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("returns contrast warning for low contrast when token starts with --color-fg", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue("#123456");
    const tokens = {
      "--color-bg-secondary": "#ffffff",
    } as unknown as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--color-fg-secondary", "#111111", tokens, {} as TokenMap)
    );
    expect(mockSuggestContrastColor).toHaveBeenCalledWith(
      "#111111",
      "#ffffff"
    );
    expect(result.current).toEqual({ contrast: 3, suggestion: "#123456" });
  });

  it("pairs *-fg with base key", () => {
    mockGetContrast.mockReturnValue(5);
    const tokens = {
      "--brand": "#ffffff",
    } as unknown as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--brand-fg", "#000000", tokens, {} as TokenMap)
    );
    expect(mockGetContrast).toHaveBeenCalledWith("#000000", "#ffffff");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("returns contrast warning for low contrast when token ends with -fg", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue("#123456");
    const tokens = {
      "--brand": "#ffffff",
    } as unknown as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--brand-fg", "#111111", tokens, {} as TokenMap)
    );
    expect(mockSuggestContrastColor).toHaveBeenCalledWith(
      "#111111",
      "#ffffff"
    );
    expect(result.current).toEqual({ contrast: 3, suggestion: "#123456" });
  });

  it("finds candidate -fg key in base tokens", () => {
    mockGetContrast.mockReturnValue(5);
    const baseTokens = {
      "--accent-fg": "#000000",
    } as unknown as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--accent", "#ffffff", {} as TokenMap, baseTokens)
    );
    expect(mockGetContrast).toHaveBeenCalledWith("#ffffff", "#000000");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("returns contrast warning for low contrast when base token has -fg variant", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue("#123456");
    const baseTokens = {
      "--accent-fg": "#000000",
    } as unknown as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--accent", "#111111", {} as TokenMap, baseTokens)
    );
    expect(mockSuggestContrastColor).toHaveBeenCalledWith(
      "#111111",
      "#000000"
    );
    expect(result.current).toEqual({ contrast: 3, suggestion: "#123456" });
  });

  it("returns contrast warning for low contrast when token starts with --color-bg", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue("#123456");
    const tokens = {
      "--color-fg-primary": "#000000",
    } as unknown as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--color-bg-primary", "#111111", tokens, {} as TokenMap)
    );
    expect(mockSuggestContrastColor).toHaveBeenCalledWith(
      "#111111",
      "#000000"
    );
    expect(result.current).toEqual({ contrast: 3, suggestion: "#123456" });
  });

  it("returns null when no pair is found", () => {
    const tokens = {} as TokenMap;
    const baseTokens = {} as TokenMap;
    const { result } = renderHook(() =>
      useTokenColors("--no-pair", "#fff", tokens, baseTokens)
    );
    expect(mockGetContrast).not.toHaveBeenCalled();
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });
});

