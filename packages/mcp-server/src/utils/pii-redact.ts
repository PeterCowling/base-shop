// Order matters: email → phone → booking_ref → greeting strip.
// Greeting strip is last so the line removal doesn't confuse the ref regex.

const EMAIL_RE = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /\+?[\d\s\-().]{7,}/g;
// Booking refs: 6–10 uppercase alphanumeric chars, word-boundary delimited.
// This intentionally catches IDs like "MA4BJ9" while avoiding short words.
const BOOKING_REF_RE = /\b[A-Z0-9]{6,10}\b/g;
const GREETING_LINE_RE = /^Dear\b[^\n]*\n?/i;

/**
 * Redact PII from a string for storage in proposal artifacts.
 * Replacements applied in order: email → phone → booking ref → greeting line.
 * Idempotent: calling twice produces the same output.
 */
export function redactPii(text: string): string {
  let result = text;
  result = result.replace(EMAIL_RE, "[EMAIL]");
  result = result.replace(PHONE_RE, "[PHONE]");
  result = result.replace(BOOKING_REF_RE, "[BOOKING_REF]");
  result = result.replace(GREETING_LINE_RE, "");
  return result;
}
