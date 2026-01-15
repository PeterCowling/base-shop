// src/utils/generateTransactionId.ts

import { getItalyTimestampCompact } from "./dateUtils";

/**
 * Generates a unique transaction ID based on the current date/time
 * in Europe/Rome. Format: txn_YYYYMMDDhhmmssfff
 *
 * Example: txn_20230115121059751
 */
export function generateTransactionId(): string {
  return `txn_${getItalyTimestampCompact(new Date())}`;
}
