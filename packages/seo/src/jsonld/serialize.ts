/**
 * XSS-safe JSON-LD serializer.
 * Escapes characters that could break out of a <script> context.
 * Canonical implementation — `@acme/ui/lib/seo/serializeJsonLd` re-exports this.
 */
export function serializeJsonLdValue(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
