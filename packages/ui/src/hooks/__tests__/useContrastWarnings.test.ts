import { renderHook } from "@testing-library/react";

import {
  getContrast,
  suggestContrastColor,
} from "../../components/cms/ColorInput";
import useContrastWarnings from "../useContrastWarnings";

jest.mock("../../components/cms/ColorInput", () => ({
  getContrast: jest.fn(),
  suggestContrastColor: jest.fn(),
}));

const mockGetContrast = getContrast as jest.MockedFunction<typeof getContrast>;
const mockSuggestContrastColor = suggestContrastColor as jest.MockedFunction<
  typeof suggestContrastColor
>;

// i18n-exempt: test names
describe("useContrastWarnings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // i18n-exempt: test name
  it("returns null when contrast is sufficient", () => {
    mockGetContrast.mockReturnValue(5);
    const { result } = renderHook(() =>
      useContrastWarnings("var(--color-fg)", "var(--color-bg)")
    );
    expect(result.current).toBeNull();
    expect(mockGetContrast).toHaveBeenCalledWith(
      "var(--color-fg)",
      "var(--color-bg)"
    );
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
  });

  // i18n-exempt: test name
  it("returns null when contrast equals threshold", () => {
    mockGetContrast.mockReturnValue(4.5);
    const { result } = renderHook(() =>
      useContrastWarnings("var(--color-fg)", "var(--color-bg)")
    );
    expect(result.current).toBeNull();
    expect(mockGetContrast).toHaveBeenCalledWith(
      "var(--color-fg)",
      "var(--color-bg)"
    );
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
  });

  // i18n-exempt: test name
  it("provides suggestion when contrast is low", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue("var(--color-suggested)");
    const { result } = renderHook(() =>
      useContrastWarnings("var(--color-fg)", "var(--color-muted)"),
    );
    expect(mockGetContrast).toHaveBeenCalledWith(
      "var(--color-fg)",
      "var(--color-muted)"
    );
    expect(mockSuggestContrastColor).toHaveBeenCalledWith(
      "var(--color-fg)",
      "var(--color-muted)"
    );
    expect(result.current).toEqual({ contrast: 3, suggestion: "var(--color-suggested)" });
    expect(result.current?.suggestion).toBe("var(--color-suggested)");
  });

  // i18n-exempt: test name
  it("handles null suggestion from suggestContrastColor", () => {
    mockGetContrast.mockReturnValue(3);
    mockSuggestContrastColor.mockReturnValue(null);
    const { result } = renderHook(() =>
      useContrastWarnings("var(--color-fg)", "var(--color-muted)")
    );
    expect(mockGetContrast).toHaveBeenCalledWith(
      "var(--color-fg)",
      "var(--color-muted)"
    );
    expect(mockSuggestContrastColor).toHaveBeenCalledWith(
      "var(--color-fg)",
      "var(--color-muted)"
    );
    expect(result.current).toEqual({ contrast: 3, suggestion: null });
  });

  // i18n-exempt: test name
  it("returns null when foreground color is empty", () => {
    const { result } = renderHook(() =>
      useContrastWarnings("", "var(--color-bg)")
    );
    expect(result.current).toBeNull();
    expect(mockGetContrast).not.toHaveBeenCalled();
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
  });

  // i18n-exempt: test name
  it("returns null when background color is empty", () => {
    const { result } = renderHook(() =>
      useContrastWarnings("var(--color-fg)", "")
    );
    expect(result.current).toBeNull();
    expect(mockGetContrast).not.toHaveBeenCalled();
    expect(mockSuggestContrastColor).not.toHaveBeenCalled();
  });
});
