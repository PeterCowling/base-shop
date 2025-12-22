// src/routes/guides/day-trip-capri-from-positano/safeString.ts
export function safeString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}
