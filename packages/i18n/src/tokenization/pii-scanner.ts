/**
 * I18N-PIPE-00b: PII Scanner for content filtering
 *
 * Secondary safety net to detect content that should NEVER be sent
 * to external translation providers:
 * - Social Security Numbers
 * - Credit card numbers
 * - Other national ID patterns
 *
 * Note: This is a blocking filter, not tokenization.
 * PII should not exist in translatable content at all.
 */

import type { PiiScanResult, PiiType } from "./types.js";

/**
 * Luhn algorithm to validate credit card numbers.
 */
function isValidLuhn(digits: string): boolean {
  const arr = digits.split("").reverse().map(Number);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    let digit = arr[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * PII detection patterns.
 *
 * IMPORTANT: These are designed to catch obvious PII patterns.
 * They may have false positives/negatives. The goal is to block
 * content that clearly shouldn't be translated.
 */
const PII_PATTERNS: Record<PiiType, RegExp[]> = {
  // US Social Security Numbers: XXX-XX-XXXX or XXXXXXXXX
  ssn: [
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  ],

  // Credit card numbers (13-19 digits, with or without separators)
  // Includes Visa, MasterCard, Amex, Discover patterns
  credit_card: [
    /\b4[0-9]{12}(?:[0-9]{3})?\b/g, // Visa
    /\b5[1-5][0-9]{14}\b/g, // MasterCard
    /\b3[47][0-9]{13}\b/g, // Amex
    /\b6(?:011|5[0-9]{2})[0-9]{12}\b/g, // Discover
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, // General 16-digit with separators
  ],

  // Passport numbers (various formats, conservative matching)
  passport: [
    /\b[A-Z]{1,2}\d{6,9}\b/gi, // Common format: 1-2 letters + 6-9 digits
  ],

  // National ID patterns (various countries)
  national_id: [
    // UK National Insurance: AB123456C
    /\b[A-Z]{2}\d{6}[A-Z]\b/gi,
    // German ID: 1234567890 (10 digits)
    /\b\d{10}\b/g,
  ],
};

/**
 * Additional context patterns that reduce false positive risk.
 * If these words appear near a potential PII match, it's more likely real PII.
 */
const PII_CONTEXT_WORDS = [
  "ssn",
  "social security",
  "credit card",
  "card number",
  "passport",
  "id number",
  "national id",
  "insurance number",
  "tax id",
  "tin",
];

/**
 * Scan text for potential PII content.
 */
export function scanForPii(text: string): PiiScanResult {
  const detectedTypes: PiiType[] = [];
  const lowerText = text.toLowerCase();

  // Check if text contains PII context words (increases confidence)
  const hasContextWords = PII_CONTEXT_WORDS.some((word) =>
    lowerText.includes(word)
  );

  // Scan for each PII type
  for (const [type, patterns] of Object.entries(PII_PATTERNS) as [
    PiiType,
    RegExp[],
  ][]) {
    for (const pattern of patterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      const matches = text.match(pattern);

      if (matches && matches.length > 0) {
        // Additional validation for credit cards (Luhn check)
        if (type === "credit_card") {
          const hasValidCard = matches.some((match) => {
            const digits = match.replace(/[-\s]/g, "");
            return digits.length >= 13 && digits.length <= 19 && isValidLuhn(digits);
          });
          if (hasValidCard) {
            detectedTypes.push(type);
            break;
          }
        }
        // For SSN, require either context words or exact format
        else if (type === "ssn") {
          if (hasContextWords) {
            detectedTypes.push(type);
            break;
          }
          // Check for exact XXX-XX-XXXX format (more confident)
          const exactSsnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
          if (exactSsnPattern.test(text)) {
            detectedTypes.push(type);
            break;
          }
        }
        // For passport/national_id, require context words to reduce false positives
        else if (type === "passport" || type === "national_id") {
          if (hasContextWords) {
            detectedTypes.push(type);
            break;
          }
        }
      }
    }
  }

  // Determine if content should be blocked
  const hasPii = detectedTypes.length > 0;
  const blocked = detectedTypes.includes("ssn") || detectedTypes.includes("credit_card");

  // Determine block reason
  let blockReason: PiiScanResult["blockReason"];
  if (detectedTypes.includes("ssn")) {
    blockReason = "ssn";
  } else if (detectedTypes.includes("credit_card")) {
    blockReason = "credit_card";
  } else if (hasPii) {
    blockReason = "other_pii";
  }

  return {
    hasPii,
    piiTypes: detectedTypes,
    blocked,
    blockReason,
  };
}

/**
 * Check if a specific string looks like a credit card number.
 * More lenient check for use in other contexts.
 */
export function looksLikeCreditCard(text: string): boolean {
  const digits = text.replace(/[-\s]/g, "");
  if (!/^\d+$/.test(digits)) return false;
  if (digits.length < 13 || digits.length > 19) return false;
  return isValidLuhn(digits);
}

/**
 * Check if a specific string looks like an SSN.
 */
export function looksLikeSsn(text: string): boolean {
  // Must be exactly XXX-XX-XXXX format or 9 digits
  const ssnPattern = /^\d{3}-\d{2}-\d{4}$|^\d{9}$/;
  return ssnPattern.test(text);
}
