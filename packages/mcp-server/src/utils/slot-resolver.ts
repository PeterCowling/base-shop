/**
 * Resolves {{SLOT:KEY}} markers in a string, replacing each with the
 * corresponding value from the provided slots map.
 *
 * Rules:
 * - Slot names must be SCREAMING_SNAKE_CASE (e.g. GREETING, KNOWLEDGE_INJECTION).
 * - Lowercase or mixed-case slot names do NOT match.
 * - Unresolved slots (no key in map, or null/undefined value) are silently removed (replaced with "").
 * - Pure passthrough if body contains no slot markers.
 * - Idempotent: calling twice with the same args produces the same output.
 *
 * Known slot names (by convention): GREETING, KNOWLEDGE_INJECTION, BOOKING_REF, CTA, POLICY_NOTE, APP_LINK
 */
export function resolveSlots(
  body: string,
  slots: Record<string, string | null | undefined>,
): string {
  return body.replace(/\{\{SLOT:([A-Z_]+)\}\}/g, (_match, key: string) => {
    const value = slots[key];
    return value != null ? value : "";
  });
}
