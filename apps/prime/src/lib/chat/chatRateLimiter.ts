/**
 * chatRateLimiter.ts
 *
 * Rate limiter for chat messages to prevent spam and abuse.
 * Uses sliding window algorithm with per-user per-channel tracking.
 *
 * Configuration:
 * - 10 messages per user per minute
 * - 100 messages per user per hour
 * - Automatically cleans up old entries
 *
 * Note: This is in-memory client-side rate limiting. For production
 * with server-side enforcement, consider Cloudflare KV or @upstash/ratelimit.
 */

/**
 * Rate limit configuration for chat messages.
 */
export const CHAT_RATE_LIMITS = {
  /** Maximum messages per user per minute */
  messagesPerMinute: 10,
  /** Maximum messages per user per hour */
  messagesPerHour: 100,
  /** Window duration for per-minute limit (1 minute in ms) */
  windowMs: 60 * 1000,
  /** Window duration for per-hour limit (1 hour in ms) */
  hourWindowMs: 60 * 60 * 1000,
} as const;

/**
 * Message record for rate limiting.
 */
interface MessageRecord {
  /** Timestamp of the message */
  timestamp: number;
}

/**
 * User-channel record tracking all messages.
 */
interface UserChannelRecord {
  /** Array of message timestamps */
  messages: MessageRecord[];
}

/**
 * Rate limit check result.
 */
export interface ChatRateLimitResult {
  /** Whether the message is allowed */
  allowed: boolean;
  /** Milliseconds until rate limit resets (if blocked) */
  retryAfterMs?: number;
  /** Current message count in window */
  current: number;
  /** Messages remaining in window */
  remaining: number;
}

/**
 * In-memory chat rate limiter.
 * Tracks messages per user per channel with sliding window algorithm.
 */
export class ChatRateLimiter {
  /**
   * In-memory store for rate limiting data.
   * Keys are "userId:channelId", values are message records.
   */
  private store = new Map<string, UserChannelRecord>();

  /**
   * Generate storage key from user and channel IDs.
   */
  private getKey(userId: string, channelId: string): string {
    return `${userId}:${channelId}`;
  }

  /**
   * Check if a message from a user in a channel is rate limited.
   *
   * @param userId - The user sending the message
   * @param channelId - The channel ID
   * @param recordMessage - Whether to record this as a message (default false for check-only)
   * @returns Rate limit check result
   */
  checkLimit(
    userId: string,
    channelId: string,
    recordMessage = false,
  ): ChatRateLimitResult {
    const now = Date.now();
    const key = this.getKey(userId, channelId);
    const minuteWindowStart = now - CHAT_RATE_LIMITS.windowMs;
    const hourWindowStart = now - CHAT_RATE_LIMITS.hourWindowMs;

    // Get or create user-channel record
    let record = this.store.get(key);
    if (!record) {
      record = { messages: [] };
      this.store.set(key, record);
    }

    // Filter to messages within the hour window (includes minute window)
    record.messages = record.messages.filter((m) => m.timestamp >= hourWindowStart);

    // Count messages in each window
    const messagesInMinute = record.messages.filter(
      (m) => m.timestamp >= minuteWindowStart,
    ).length;
    const messagesInHour = record.messages.length;

    // Check both limits
    const allowedByMinute = messagesInMinute < CHAT_RATE_LIMITS.messagesPerMinute;
    const allowedByHour = messagesInHour < CHAT_RATE_LIMITS.messagesPerHour;
    const allowed = allowedByMinute && allowedByHour;

    // Calculate retry time if blocked
    let retryAfterMs: number | undefined;
    if (!allowed) {
      if (!allowedByMinute) {
        // Blocked by per-minute limit - retry after oldest message in minute window expires
        const oldestInMinute = record.messages.find(
          (m) => m.timestamp >= minuteWindowStart,
        );
        if (oldestInMinute) {
          retryAfterMs = oldestInMinute.timestamp + CHAT_RATE_LIMITS.windowMs - now;
        }
      } else {
        // Blocked by per-hour limit - retry after oldest message in hour window expires
        const oldestInHour = record.messages[0];
        if (oldestInHour) {
          retryAfterMs = oldestInHour.timestamp + CHAT_RATE_LIMITS.hourWindowMs - now;
        }
      }
    }

    // Record the message if allowed and requested
    if (allowed && recordMessage) {
      record.messages.push({ timestamp: now });
    }

    const current = messagesInMinute + (allowed && recordMessage ? 1 : 0);
    const remaining = Math.max(
      0,
      CHAT_RATE_LIMITS.messagesPerMinute - current,
    );

    return {
      allowed,
      retryAfterMs,
      current,
      remaining,
    };
  }

  /**
   * Record a message for rate limiting.
   * Use this after successful message send.
   *
   * @param userId - The user who sent the message
   * @param channelId - The channel ID
   */
  recordMessage(userId: string, channelId: string): void {
    this.checkLimit(userId, channelId, true);
  }
}

/**
 * Clear rate limit data for testing purposes.
 * DO NOT use in production.
 */
export function _clearChatRateLimitStore(): void {
  // This is a no-op for the class-based limiter since each instance has its own store
  // Tests should create fresh instances instead
}
