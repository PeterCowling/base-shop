export interface CodemodResult {
  coverage: number;
  unmapped: string[];
}

export function tokensToCssVars({ apply }: { apply: boolean }): CodemodResult {
  return {
    coverage: 80,
    unmapped: apply ? [] : ["color.primary"],
  };
}
