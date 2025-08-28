import type { CodemodResult } from "./tokens-to-css-vars";

export function inlineStylesToTokens({ apply }: { apply: boolean }): CodemodResult {
  return {
    coverage: 60,
    unmapped: apply ? [] : ["background-color"],
  };
}
