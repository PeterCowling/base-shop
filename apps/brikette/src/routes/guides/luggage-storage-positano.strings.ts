// src/routes/guides/luggage-storage-positano.strings.ts
export function resolveLuggageStorageString(
  value: unknown,
  key: string,
  fallback?: unknown,
  defaultValue?: string,
): string | undefined {
  // Treat both the fully-qualified key (e.g., "content.x.y") and the compact
  // variant (e.g., "x.y") as placeholders so we don't accept raw i18n keys
  // that can be surfaced by translateGuides fallbacks in tests.
  const isPlaceholder = (s: string, expectedKey: string): boolean => {
    const trimmed = s.trim();
    if (!trimmed) return true;
    if (trimmed === expectedKey) return true;
    const compact = expectedKey.replace(/^content\./, "");
    if (trimmed === compact) return true;
    return false;
  };

  if (typeof value === "string" && value.trim().length > 0 && !isPlaceholder(value, key)) {
    return value;
  }
  if (typeof fallback === "string" && fallback.trim().length > 0 && !isPlaceholder(fallback, key)) {
    return fallback;
  }
  return defaultValue;
}
