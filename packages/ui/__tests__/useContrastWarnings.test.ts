/* eslint-disable ds/no-raw-color -- DS-TEST-012: raw hex inputs are necessary to exercise contrast calculations */
import { renderHook } from "@testing-library/react";
import useContrastWarnings from "../src/hooks/useContrastWarnings";

jest.mock("../src/components/cms/ColorInput", () => ({
  getContrast: jest.fn(),
  suggestContrastColor: jest.fn(),
}));

import {
  getContrast,
  suggestContrastColor,
} from "../src/components/cms/ColorInput";

const mockGetContrast = getContrast as jest.MockedFunction<typeof getContrast>;
const mockSuggestContrastColor =
  suggestContrastColor as jest.MockedFunction<typeof suggestContrastColor>;

describe("useContrastWarnings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when contrast is sufficient", () => {
    mockGetContrast.mockReturnValue(5);
    const { result } = renderHook(() => useContrastWarnings("#000", "#fff"));
    expect(result.current).toBeNull();
    expect(mockGetContrast).toHaveBeenCalledWith("#000", "#fff");
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
  });

  it("provides suggestion when contrast is low", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue("#123456");
    const { result } = renderHook(() => useContrastWarnings("#000", "#111"));
    expect(mockGetContrast).toHaveBeenCalledWith("#000", "#111");
    expect(mockSuggestContrastColor).toHaveBeenCalledWith("#000", "#111");
    expect(result.current).toEqual({ contrast: 3, suggestion: "#123456" });
  });

  it("returns null suggestion when contrast is low but no color suggested", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue(null);
    const { result } = renderHook(() => useContrastWarnings("#000", "#111"));
    expect(mockGetContrast).toHaveBeenCalledWith("#000", "#111");
    expect(mockSuggestContrastColor).toHaveBeenCalledWith("#000", "#111");
    expect(result.current).toEqual({ contrast: 3, suggestion: null });
  });

  it("returns null when colors are missing", () => {
    const { result } = renderHook(() => useContrastWarnings("", "#fff"));
    expect(result.current).toBeNull();
    expect(mockGetContrast).not.toHaveBeenCalled();
  });
});
