import { useMemo } from "react";

import { getContrast, suggestContrastColor } from "../components/cms/ColorInput";

import type { TokenMap } from "./useTokenEditor";

export interface ContrastWarning {
  contrast: number;
  suggestion: string | null;
}

export function useTokenColors(
  tokenKey: string,
  value: string,
  tokens: TokenMap,
  baseTokens: TokenMap
): ContrastWarning | null {
  return useMemo(() => {
    let pairKey = "";
    if (tokenKey.startsWith("--color-bg")) {
      pairKey = `--color-fg${tokenKey.slice("--color-bg".length)}`;
    } else if (tokenKey.startsWith("--color-fg")) {
      pairKey = `--color-bg${tokenKey.slice("--color-fg".length)}`;
    } else if (tokenKey.endsWith("-fg")) {
      pairKey = tokenKey.slice(0, -3);
    } else {
      const candidate = `${tokenKey}-fg`;
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
  }, [tokenKey, value, tokens, baseTokens]);
}
