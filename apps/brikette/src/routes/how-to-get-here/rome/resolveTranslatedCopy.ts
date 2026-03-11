// Shared helper for resolving translated copy within the Rome travel planner components.
// Falls back to `fallback` when the value is not a string, is empty, or equals the raw i18n key.
export function resolveTranslatedCopy(value: unknown, key: string, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed === key) return fallback;
  return trimmed;
}
