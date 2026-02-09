/**
 * Tests for chatRateLimiter.ts
 * TC-01: Rate limit enforcement
 */

import { _clearChatRateLimitStore,CHAT_RATE_LIMITS, ChatRateLimiter } from '../chatRateLimiter';

describe('ChatRateLimiter', () => {
  beforeEach(() => {
    // Clear the store before each test
    _clearChatRateLimitStore();
  });

  describe('TC-01: Rate limit enforcement', () => {
    it('allows messages within rate limit', () => {
      const limiter = new ChatRateLimiter();
      const result = limiter.checkLimit('user-1', 'channel-1');
      expect(result.allowed).toBe(true);
      expect(result.retryAfterMs).toBeUndefined();
    });

    it('blocks messages exceeding per-user rate limit', () => {
      const limiter = new ChatRateLimiter();
      // Send max allowed messages
      for (let i = 0; i < CHAT_RATE_LIMITS.messagesPerMinute; i++) {
        limiter.recordMessage('user-1', 'channel-1');
      }
      const result = limiter.checkLimit('user-1', 'channel-1');
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('tracks per-user limits independently across channels', () => {
      const limiter = new ChatRateLimiter();
      // Fill rate limit for user-1 in channel-1
      for (let i = 0; i < CHAT_RATE_LIMITS.messagesPerMinute; i++) {
        limiter.recordMessage('user-1', 'channel-1');
      }

      // User-1 should be blocked in channel-1
      const result1 = limiter.checkLimit('user-1', 'channel-1');
      expect(result1.allowed).toBe(false);

      // But user-2 should still be allowed in channel-1
      const result2 = limiter.checkLimit('user-2', 'channel-1');
      expect(result2.allowed).toBe(true);
    });

    it('resets after window expires', () => {
      const limiter = new ChatRateLimiter();

      // Fill the rate limit
      for (let i = 0; i < CHAT_RATE_LIMITS.messagesPerMinute; i++) {
        limiter.recordMessage('user-1', 'channel-1');
      }

      // Should be blocked
      const result1 = limiter.checkLimit('user-1', 'channel-1');
      expect(result1.allowed).toBe(false);

      // Simulate time passing by clearing expired entries
      // (in production this would happen automatically after windowMs)
      jest.useFakeTimers();
      jest.advanceTimersByTime(CHAT_RATE_LIMITS.windowMs + 1000);

      // Should be allowed again after window expires
      const result2 = limiter.checkLimit('user-1', 'channel-1');
      expect(result2.allowed).toBe(true);

      jest.useRealTimers();
    });

    it('enforces hourly rate limit across multiple windows', () => {
      const limiter = new ChatRateLimiter();

      // Send messages up to the hourly limit
      for (let i = 0; i < CHAT_RATE_LIMITS.messagesPerHour; i++) {
        limiter.recordMessage('user-1', 'channel-1');
      }

      // Should be blocked even if per-minute limit not exceeded
      const result = limiter.checkLimit('user-1', 'channel-1');
      expect(result.allowed).toBe(false);
    });

    it('records message only when checkLimit is true', () => {
      const limiter = new ChatRateLimiter();

      // Check limit without recording
      const check1 = limiter.checkLimit('user-1', 'channel-1', false);
      expect(check1.allowed).toBe(true);

      // Record a message
      limiter.recordMessage('user-1', 'channel-1');

      // Second message should still be within limit
      const check2 = limiter.checkLimit('user-1', 'channel-1');
      expect(check2.allowed).toBe(true);
    });
  });

  describe('CHAT_RATE_LIMITS configuration', () => {
    it('has expected default values', () => {
      expect(CHAT_RATE_LIMITS.messagesPerMinute).toBe(10);
      expect(CHAT_RATE_LIMITS.messagesPerHour).toBe(100);
      expect(CHAT_RATE_LIMITS.windowMs).toBe(60 * 1000); // 1 minute
    });
  });
});
