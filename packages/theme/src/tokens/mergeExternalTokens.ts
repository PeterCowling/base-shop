export function mergeExternalTokens(
  base: Record<string, string>,
  external: Record<string, string>,
): Record<string, string> {
  return { ...base, ...external };
}
