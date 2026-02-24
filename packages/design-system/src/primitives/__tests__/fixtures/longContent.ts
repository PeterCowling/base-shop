export const LONG_UNBROKEN_TOKEN =
  "BOOKINGTOKEN_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const LONG_URL =
  "https://example.com/check-in/" +
  "very-long-path-segment-".repeat(8) +
  "?reservation=" +
  LONG_UNBROKEN_TOKEN;

export const LONG_SENTENCE_WITH_TOKEN =
  "Guest provided an unusually long reference token for pre-arrival checks: " +
  LONG_UNBROKEN_TOKEN;
