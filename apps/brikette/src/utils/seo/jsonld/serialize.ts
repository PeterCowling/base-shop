import { serializeJsonLd } from "@acme/ui/lib/seo/serializeJsonLd";

const escapeJsonLdString = (value: string): string =>
  value
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export function serializeJsonLdValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown> | unknown[];
      return serializeJsonLd(parsed);
    } catch {
      return escapeJsonLdString(trimmed);
    }
  }
  if (typeof value === "object") {
    return serializeJsonLd(value as Record<string, unknown> | unknown[]);
  }
  return "";
}
