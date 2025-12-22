export function resolveLabel(
  value: unknown,
  fallback: unknown,
  key: string,
  defaultLabel: string,
): string {
  const normalise = (input: unknown): string | null => {
    if (typeof input !== "string") {
      return null;
    }
    const trimmed = input.trim();
    if (trimmed.length === 0 || trimmed === key) {
      return null;
    }
    return trimmed;
  };

  return normalise(value) ?? normalise(fallback) ?? defaultLabel;
}
