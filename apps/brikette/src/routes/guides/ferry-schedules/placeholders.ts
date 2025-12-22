// src/routes/guides/ferry-schedules/placeholders.ts

export function buildPlaceholderKeys(primaryKey: string, fallbackKey: string): string[] {
  const keys = new Set<string>();
  const register = (key: string) => {
    const trimmed = key.trim();
    if (trimmed.length === 0) return;
    keys.add(trimmed);
    if (trimmed.startsWith("content.")) {
      keys.add(trimmed.replace(/^content\./, ""));
    } else {
      keys.add(`content.${trimmed}`);
    }
  };

  register(primaryKey);
  register(fallbackKey);

  return [...keys];
}

export function sanitiseStringValue(value: unknown, keys: readonly string[]): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  for (const key of keys) {
    if (trimmed === key || trimmed.startsWith(`${key}.`)) {
      return undefined;
    }
  }
  return trimmed;
}

export function sanitiseArrayValues<T>(values: T[], keys: readonly string[]): T[] {
  if (!Array.isArray(values) || values.length === 0) {
    return values;
  }
  if (values.every((item) => typeof item === "string")) {
    const filtered = (values as string[])
      .map((item) => sanitiseStringValue(item, keys))
      .filter((item): item is string => typeof item === "string");
    return filtered as unknown as T[];
  }
  return values;
}
