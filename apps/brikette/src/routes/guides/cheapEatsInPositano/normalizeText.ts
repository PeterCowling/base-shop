// src/routes/guides/cheapEatsInPositano/normalizeText.ts
export function normalizeText(value: unknown, key?: string): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (key && trimmed === key) return undefined;
  return trimmed;
}
