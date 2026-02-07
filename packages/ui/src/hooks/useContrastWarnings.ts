import { useMemo } from "react";

import { getContrast, suggestContrastColor } from "../components/cms/ColorInput";

export interface ContrastWarning {
  contrast: number;
  suggestion: string | null;
}

export default function useContrastWarnings(
  fg: string,
  bg: string
): ContrastWarning | null {
  return useMemo(() => {
    if (!fg || !bg) return null;
    const contrast = getContrast(fg, bg);
    if (contrast < 4.5) {
      return { contrast, suggestion: suggestContrastColor(fg, bg) };
    }
    return null;
  }, [fg, bg]);
}
