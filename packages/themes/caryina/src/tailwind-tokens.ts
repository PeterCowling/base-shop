import { type TokenMap, tokens as caryinaTokens } from "./tokens";

function flattenThemeTokens(tokens: TokenMap): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [name, value] of Object.entries(tokens)) {
    flattened[name] = value.light;
    if (value.dark !== undefined) {
      flattened[`${name}-dark`] = value.dark;
    }
  }

  return flattened;
}

export const tokens: Record<string, string> = flattenThemeTokens(caryinaTokens);
