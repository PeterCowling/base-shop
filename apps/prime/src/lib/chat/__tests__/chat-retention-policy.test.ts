/**
 * Tests for chatRetentionPolicy.ts
 * TC-03: Retention policy and message filtering
 */

import {
  filterExpiredMessages,
  isMessageExpired,
  RETENTION_POLICY,
} from '../chatRetentionPolicy';

interface TestMessage {
  id: string;
  createdAt: number;
  content: string;
}

describe('ChatRetentionPolicy', () => {
  describe('TC-03: Retention filtering', () => {
    it('marks messages older than retention window as expired', () => {
      const oldMessage = {
        id: 'msg-1',
        createdAt: Date.now() - RETENTION_POLICY.maxAgeMs - 1000,
        content: 'Old message',
      };

      expect(isMessageExpired(oldMessage)).toBe(true);
    });

    it('keeps messages within retention window', () => {
      const recentMessage = {
        id: 'msg-2',
        createdAt: Date.now() - 1000,
        content: 'Recent message',
      };

      expect(isMessageExpired(recentMessage)).toBe(false);
    });

    it('keeps messages exactly at retention boundary', () => {
      const boundaryMessage = {
        id: 'msg-3',
        createdAt: Date.now() - RETENTION_POLICY.maxAgeMs,
        content: 'Boundary message',
      };

      // Message exactly at the boundary should NOT be expired
      expect(isMessageExpired(boundaryMessage)).toBe(false);
    });

    it('filters expired messages from display set', () => {
      const now = Date.now();
      const messages: TestMessage[] = [
        {
          id: 'msg-1',
          createdAt: now - RETENTION_POLICY.maxAgeMs - 10000, // Expired
          content: 'Very old',
        },
        {
          id: 'msg-2',
          createdAt: now - 1000, // Recent
          content: 'Recent 1',
        },
        {
          id: 'msg-3',
          createdAt: now - RETENTION_POLICY.maxAgeMs - 5000, // Expired
          content: 'Old',
        },
        {
          id: 'msg-4',
          createdAt: now - 500, // Recent
          content: 'Recent 2',
        },
      ];

      const filtered = filterExpiredMessages(messages);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((m) => m.id)).toEqual(['msg-2', 'msg-4']);
    });

    it('returns empty array when all messages are expired', () => {
      const messages: TestMessage[] = [
        {
          id: 'msg-1',
          createdAt: Date.now() - RETENTION_POLICY.maxAgeMs - 10000,
          content: 'Old 1',
        },
        {
          id: 'msg-2',
          createdAt: Date.now() - RETENTION_POLICY.maxAgeMs - 5000,
          content: 'Old 2',
        },
      ];

      const filtered = filterExpiredMessages(messages);
      expect(filtered).toHaveLength(0);
    });

    it('returns all messages when none are expired', () => {
      const messages: TestMessage[] = [
        {
          id: 'msg-1',
          createdAt: Date.now() - 1000,
          content: 'Recent 1',
        },
        {
          id: 'msg-2',
          createdAt: Date.now() - 500,
          content: 'Recent 2',
        },
      ];

      const filtered = filterExpiredMessages(messages);
      expect(filtered).toHaveLength(2);
      expect(filtered).toEqual(messages);
    });

    it('handles empty message array', () => {
      const filtered = filterExpiredMessages([]);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('RETENTION_POLICY configuration', () => {
    it('has expected default values', () => {
      expect(RETENTION_POLICY.maxAgeDays).toBe(30);
      expect(RETENTION_POLICY.maxAgeMs).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('maxAgeMs matches maxAgeDays conversion', () => {
      const expectedMs = RETENTION_POLICY.maxAgeDays * 24 * 60 * 60 * 1000;
      expect(RETENTION_POLICY.maxAgeMs).toBe(expectedMs);
    });
  });
});
