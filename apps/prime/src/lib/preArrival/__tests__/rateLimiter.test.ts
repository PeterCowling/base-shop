/**
 * Tests for rateLimiter.ts
 */

import {
  _clearRateLimitStore,
  checkRateLimit,
  getRateLimitHeaders,
  getRateLimitStatus,
  RATE_LIMIT_CONFIG,
} from '../rateLimiter';

describe('rateLimiter', () => {
  beforeEach(() => {
    // Clear the store before each test
    _clearRateLimitStore();
  });

  describe('checkRateLimit', () => {
    it('allows first request from an IP', () => {
      const result = checkRateLimit('192.168.1.1');
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(1);
      expect(result.remaining).toBe(RATE_LIMIT_CONFIG.maxRequests - 1);
    });

    it('allows up to maxRequests requests', () => {
      const ip = '192.168.1.2';

      for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequests; i++) {
        const result = checkRateLimit(ip);
        expect(result.allowed).toBe(true);
        expect(result.current).toBe(i + 1);
      }
    });

    it('blocks requests after maxRequests reached', () => {
      const ip = '192.168.1.3';

      // Make maxRequests allowed requests
      for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequests; i++) {
        checkRateLimit(ip);
      }

      // Next request should be blocked
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('tracks different IPs separately', () => {
      const ip1 = '192.168.1.4';
      const ip2 = '192.168.1.5';

      // Use up all requests for IP1
      for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequests; i++) {
        checkRateLimit(ip1);
      }

      // IP2 should still be allowed
      const result = checkRateLimit(ip2);
      expect(result.allowed).toBe(true);
    });

    it('does not record request when recordRequest is false', () => {
      const ip = '192.168.1.6';

      // Check without recording
      const check1 = checkRateLimit(ip, false);
      expect(check1.current).toBe(0);

      // Check with recording
      const check2 = checkRateLimit(ip, true);
      expect(check2.current).toBe(1);

      // Check without recording again - should still be 1
      const check3 = checkRateLimit(ip, false);
      expect(check3.current).toBe(1);
    });
  });

  describe('getRateLimitStatus', () => {
    it('returns status without recording a request', () => {
      const ip = '192.168.1.7';

      // Make one request
      checkRateLimit(ip);

      // Get status - should not increment
      const status1 = getRateLimitStatus(ip);
      expect(status1.current).toBe(1);

      const status2 = getRateLimitStatus(ip);
      expect(status2.current).toBe(1);
    });
  });

  describe('getRateLimitHeaders', () => {
    it('returns correct headers', () => {
      const result = checkRateLimit('192.168.1.8');
      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe(String(RATE_LIMIT_CONFIG.maxRequests));
      expect(headers['X-RateLimit-Remaining']).toBe(String(result.remaining));
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });
  });

  describe('RATE_LIMIT_CONFIG', () => {
    it('has expected values', () => {
      expect(RATE_LIMIT_CONFIG.maxRequests).toBe(5);
      expect(RATE_LIMIT_CONFIG.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    });
  });
});
