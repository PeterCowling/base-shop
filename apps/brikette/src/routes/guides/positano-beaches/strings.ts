const isNonEmptyLocalizedString = (value: unknown, key: string): value is string => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== key;
};

export const resolveLocalizedString = (value: unknown, fallback: string, key: string): string => {
  const normalizedFallback = isNonEmptyLocalizedString(fallback, key) ? fallback.trim() : "";
  if (isNonEmptyLocalizedString(value, key)) {
    return value.trim();
  }
  return normalizedFallback.length > 0 ? normalizedFallback : key;
};
