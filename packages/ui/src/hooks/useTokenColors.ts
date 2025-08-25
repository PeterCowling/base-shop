import { useMemo } from "react";
import type { TokenMap } from "./useTokenEditor";
import { getContrast, suggestContrastColor } from "../components/cms/ColorInput";

export interface ContrastWarning {
  contrast: number;
  suggestion: string | null;
}

export function useTokenColors(
  key: string,
  value: string,
  tokens: TokenMap,
  baseTokens: TokenMap
): ContrastWarning | null {
  return useMemo(() => {
    let pairKey = "";
    if (key.startsWith("--color-bg")) {
      pairKey = `--color-fg${key.slice("--color-bg".length)}`;
    } else if (key.startsWith("--color-fg")) {
      pairKey = `--color-bg${key.slice("--color-fg".length)}`;
    } else if (key.endsWith("-fg")) {
      pairKey = key.slice(0, -3);
    } else {
      const candidate = `${key}-fg`;
      if (
        tokens[candidate as keyof TokenMap] !== undefined ||
        baseTokens[candidate as keyof TokenMap] !== undefined
      ) {
        pairKey = candidate;
      }
    }
    const pairVal = pairKey
      ? tokens[pairKey as keyof TokenMap] ??
        baseTokens[pairKey as keyof TokenMap]
      : undefined;
    if (pairVal) {
      const contrast = getContrast(value, pairVal);
      if (contrast < 4.5) {
        const suggestion = suggestContrastColor(value, pairVal);
        return { contrast, suggestion };
      }
    }
    return null;
  }, [key, value, tokens, baseTokens]);
}
