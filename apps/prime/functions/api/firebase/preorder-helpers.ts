/**
 * Helpers for Prime preorder bridge write:
 * - serviceDateToBarPath: converts ISO date to Firebase bar path segments
 * - generatePreorderTxnId: generates a txnId matching Reception's generateTransactionId format
 *
 * txnId format: txn_YYYYMMDDHHmmssfff (17 digits after prefix, Rome timezone)
 * Matches Reception's generateTransactionId() exactly.
 */

/**
 * Convert an ISO date string (YYYY-MM-DD) to the Firebase bar path segments.
 *
 * Returns:
 *   - monthName: full English month name, title-cased (e.g. "March")
 *   - day: un-padded integer string (e.g. "1" not "01")
 *
 * This matches the format produced by Reception's getItalyLocalDateParts.
 *
 * @example
 * serviceDateToBarPath("2026-03-01") // → { monthName: "March", day: "1" }
 * serviceDateToBarPath("2026-12-31") // → { monthName: "December", day: "31" }
 */
export function serviceDateToBarPath(serviceDate: string): { monthName: string; day: string } {
  // Parse as local date to avoid UTC offset shifting the date
  const [, , dayStr] = serviceDate.split('-');
  // Use noon UTC to avoid any date rollover when constructing the Date
  const date = new Date(`${serviceDate}T12:00:00Z`);
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  const day = String(Number(dayStr));
  return { monthName, day };
}

/**
 * Generate a transaction ID matching Reception's generateTransactionId() format.
 *
 * Format: txn_YYYYMMDDHHmmssfff
 * - YYYY: 4-digit year (Rome timezone)
 * - MM: 2-digit month
 * - DD: 2-digit day
 * - HH: 2-digit hour (24h)
 * - mm: 2-digit minute
 * - ss: 2-digit second
 * - fff: 3-digit milliseconds
 *
 * Total: 4 + prefix chars = txn_ + 17 digits
 *
 * @example
 * generatePreorderTxnId() // → "txn_20260314091523042"
 */
export function generatePreorderTxnId(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');
  const ms = String(now.getMilliseconds()).padStart(3, '0');

  return `txn_${year}${month}${day}${hour}${minute}${second}${ms}`;
}
