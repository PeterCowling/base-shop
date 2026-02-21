// File: /src/parsers/cancellation-email-parser.ts
/**
 * Parser for Octorate cancellation email notifications (TASK-13)
 *
 * Extracts reservation codes from NEW CANCELLATION emails sent by Octorate.
 * Uses compound ID format: {firstNumber}_{secondNumber} → extracts first number only.
 *
 * OTA cancellation emails (Hostelworld, Booking.com) are explicitly ignored
 * to avoid duplicate processing.
 */

export interface CancellationEmailResult {
  reservationCode: string;
  provider: "octorate";
}

/**
 * Parse a cancellation email and extract the reservation code.
 *
 * @param emailHtml - The email body (HTML or plain text)
 * @param from - The sender email address
 * @returns Parsed result or null if:
 *   - Email is from OTA (not Octorate)
 *   - No reservation code found
 *   - Parsing fails
 */
export function parseCancellationEmail(
  emailHtml: string,
  from: string
): CancellationEmailResult | null {
  // Only process emails from Octorate (ignore OTA sources)
  if (!isFromOctorate(from)) {
    return null;
  }

  // Try to extract reservation code from multiple patterns
  const reservationCode = extractReservationCode(emailHtml);

  if (!reservationCode) {
    return null;
  }

  return {
    reservationCode,
    provider: "octorate",
  };
}

/**
 * Check if email is from Octorate (not an OTA like Hostelworld or Booking.com)
 */
function isFromOctorate(from: string): boolean {
  const normalizedFrom = from.toLowerCase();
  return normalizedFrom.includes("noreply@smtp.octorate.com");
}

/**
 * Extract reservation code from email using multiple pattern fallbacks.
 * Returns the first number from compound ID format (e.g., 6896451364 from 6896451364_5972003394)
 */
function extractReservationCode(emailHtml: string): string | null {
  const patterns = [
    // Pattern 1: NEW CANCELLATION subject line (e.g., "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30")
    /NEW CANCELLATION\s+(\d+_\d+)/i,

    // Pattern 2: HTML table with reservation code row
    /<td[^>]*>\s*(?:<b>)?\s*reservation code\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>(\d+_\d+)<\/td>/i,

    // Pattern 3: Plain text with compound ID
    /\b(\d{10}_\d{10})\b/,
  ];

  for (const pattern of patterns) {
    const match = emailHtml.match(pattern);
    if (match?.[1]) {
      // Extract first number from compound ID (split on underscore)
      const [firstNumber] = match[1].split("_");
      if (firstNumber) {
        return firstNumber.trim();
      }
    }
  }

  return null;
}
