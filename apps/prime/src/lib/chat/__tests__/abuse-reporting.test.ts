/**
 * Tests for abuseReporting.ts
 * TC-02: Abuse report creation and validation
 */

import {
  ABUSE_REASONS,
  AbuseReport,
  type AbuseReportInput,
  AbuseReportStatus,
  createAbuseReport,
} from '../abuseReporting';

describe('AbuseReporting', () => {
  describe('TC-02: Report creation', () => {
    it('creates moderation record with required metadata', () => {
      const input: AbuseReportInput = {
        reporterUuid: 'occ_123',
        targetMessageId: 'msg-456',
        targetUserUuid: 'occ_789',
        channelId: 'channel-1',
        reason: 'harassment',
      };

      const report = createAbuseReport(input);

      expect(report.id).toBeDefined();
      expect(report.id).toMatch(/^report_/); // ID should have prefix
      expect(report.status).toBe('pending');
      expect(report.createdAt).toBeGreaterThan(0);
      expect(report.reporterUuid).toBe('occ_123');
      expect(report.targetMessageId).toBe('msg-456');
      expect(report.targetUserUuid).toBe('occ_789');
      expect(report.channelId).toBe('channel-1');
      expect(report.reason).toBe('harassment');
    });

    it('validates required fields - reporterUuid', () => {
      const input = {
        reporterUuid: '',
        targetMessageId: 'msg-456',
        targetUserUuid: 'occ_789',
        channelId: 'channel-1',
        reason: 'harassment' as const,
      };

      expect(() => createAbuseReport(input)).toThrow('reporterUuid is required');
    });

    it('validates required fields - targetMessageId', () => {
      const input = {
        reporterUuid: 'occ_123',
        targetMessageId: '',
        targetUserUuid: 'occ_789',
        channelId: 'channel-1',
        reason: 'harassment' as const,
      };

      expect(() => createAbuseReport(input)).toThrow('targetMessageId is required');
    });

    it('validates required fields - targetUserUuid', () => {
      const input = {
        reporterUuid: 'occ_123',
        targetMessageId: 'msg-456',
        targetUserUuid: '',
        channelId: 'channel-1',
        reason: 'harassment' as const,
      };

      expect(() => createAbuseReport(input)).toThrow('targetUserUuid is required');
    });

    it('validates required fields - channelId', () => {
      const input = {
        reporterUuid: 'occ_123',
        targetMessageId: 'msg-456',
        targetUserUuid: 'occ_789',
        channelId: '',
        reason: 'harassment' as const,
      };

      expect(() => createAbuseReport(input)).toThrow('channelId is required');
    });

    it('validates required fields - reason', () => {
      const input = {
        reporterUuid: 'occ_123',
        targetMessageId: 'msg-456',
        targetUserUuid: 'occ_789',
        channelId: 'channel-1',
        reason: '' as any,
      };

      expect(() => createAbuseReport(input)).toThrow('reason is required');
    });

    it('validates reason is from allowed list', () => {
      const input = {
        reporterUuid: 'occ_123',
        targetMessageId: 'msg-456',
        targetUserUuid: 'occ_789',
        channelId: 'channel-1',
        reason: 'invalid-reason' as any,
      };

      expect(() => createAbuseReport(input)).toThrow('Invalid abuse reason');
    });

    it('includes optional description when provided', () => {
      const input: AbuseReportInput = {
        reporterUuid: 'occ_123',
        targetMessageId: 'msg-456',
        targetUserUuid: 'occ_789',
        channelId: 'channel-1',
        reason: 'other',
        description: 'User is being disruptive',
      };

      const report = createAbuseReport(input);
      expect(report.description).toBe('User is being disruptive');
    });

    it('generates unique IDs for different reports', () => {
      const input: AbuseReportInput = {
        reporterUuid: 'occ_123',
        targetMessageId: 'msg-456',
        targetUserUuid: 'occ_789',
        channelId: 'channel-1',
        reason: 'spam',
      };

      const report1 = createAbuseReport(input);
      const report2 = createAbuseReport(input);

      expect(report1.id).not.toBe(report2.id);
    });
  });

  describe('ABUSE_REASONS configuration', () => {
    it('includes all expected abuse reasons', () => {
      expect(ABUSE_REASONS).toContain('harassment');
      expect(ABUSE_REASONS).toContain('spam');
      expect(ABUSE_REASONS).toContain('inappropriate');
      expect(ABUSE_REASONS).toContain('other');
      expect(ABUSE_REASONS.length).toBe(4);
    });
  });
});
