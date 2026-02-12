/**
 * chatRetentionPolicy.ts
 *
 * Message retention policy for chat logs.
 * Defines how long messages are kept and provides utilities for filtering expired content.
 *
 * Policy:
 * - Messages older than 30 days are considered expired
 * - Expired messages should be excluded from display
 * - Server-side cleanup jobs can use this policy for deletion/anonymization
 *
 * Privacy considerations:
 * - Retention period balances guest experience (chat history) with privacy
 * - After checkout, messages older than retention window should be purged
 * - Consider anonymizing rather than deleting for moderation audit trail
 */

/**
 * Message retention policy configuration.
 */
export const RETENTION_POLICY = {
  /** Maximum age of messages in days */
  maxAgeDays: 30,
  /** Maximum age of messages in milliseconds (30 days) */
  maxAgeMs: 30 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Message interface for retention filtering.
 * Any object with createdAt timestamp can be filtered.
 */
interface MessageWithTimestamp {
  createdAt: number;
}

/**
 * Check if a message is expired based on retention policy.
 *
 * @param message - Message with createdAt timestamp
 * @param now - Current timestamp (defaults to Date.now(), injectable for testing)
 * @returns True if message is older than retention window
 */
export function isMessageExpired(
  message: MessageWithTimestamp,
  now: number = Date.now(),
): boolean {
  const age = now - message.createdAt;
  return age > RETENTION_POLICY.maxAgeMs;
}

/**
 * Filter out expired messages from a message array.
 * Returns only messages within the retention window.
 *
 * @param messages - Array of messages to filter
 * @param now - Current timestamp (defaults to Date.now(), injectable for testing)
 * @returns Filtered array with only non-expired messages
 */
export function filterExpiredMessages<T extends MessageWithTimestamp>(
  messages: T[],
  now: number = Date.now(),
): T[] {
  return messages.filter((message) => !isMessageExpired(message, now));
}

/**
 * Get the expiration timestamp for a message.
 * Messages created before this timestamp are expired.
 *
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Timestamp of retention window boundary
 */
export function getRetentionWindowStart(now: number = Date.now()): number {
  return now - RETENTION_POLICY.maxAgeMs;
}

/**
 * Get the expiration date for a message.
 * Useful for displaying "messages will be deleted on X" to users.
 *
 * @param message - Message to check
 * @returns Date when message will expire
 */
export function getMessageExpirationDate(
  message: MessageWithTimestamp,
): Date {
  return new Date(message.createdAt + RETENTION_POLICY.maxAgeMs);
}
