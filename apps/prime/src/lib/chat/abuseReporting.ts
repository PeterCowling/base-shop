/**
 * abuseReporting.ts
 *
 * Abuse reporting and moderation system for chat messages.
 * Allows guests to report inappropriate content/users, routing to staff moderation queue.
 *
 * Flow:
 * 1. Guest reports message/user via UI
 * 2. createAbuseReport() validates and creates report record
 * 3. Report is stored with status='pending' for staff review
 * 4. Staff can review, dismiss, or take action via moderation queue
 */

/**
 * Valid abuse report reasons.
 */
export const ABUSE_REASONS = [
  'harassment',
  'spam',
  'inappropriate',
  'other',
] as const;

/**
 * Abuse report reason type.
 */
export type AbuseReason = (typeof ABUSE_REASONS)[number];

/**
 * Abuse report status in moderation pipeline.
 */
export type AbuseReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

/**
 * Input for creating an abuse report.
 */
export interface AbuseReportInput {
  /** UUID of the guest filing the report */
  reporterUuid: string;
  /** ID of the message being reported */
  targetMessageId: string;
  /** UUID of the user being reported */
  targetUserUuid: string;
  /** Channel ID where the abuse occurred */
  channelId: string;
  /** Reason for the report */
  reason: AbuseReason;
  /** Optional additional context from reporter */
  description?: string;
}

/**
 * Abuse report record.
 * Stored in moderation queue for staff review.
 */
export interface AbuseReport {
  /** Unique report ID */
  id: string;
  /** UUID of the guest who filed the report */
  reporterUuid: string;
  /** ID of the message being reported */
  targetMessageId: string;
  /** UUID of the user being reported */
  targetUserUuid: string;
  /** Channel ID where the abuse occurred */
  channelId: string;
  /** Reason for the report */
  reason: AbuseReason;
  /** Optional additional context */
  description?: string;
  /** Current status in moderation pipeline */
  status: AbuseReportStatus;
  /** Timestamp when report was created */
  createdAt: number;
  /** Timestamp of last update (review, action, etc.) */
  updatedAt?: number;
  /** Staff member who reviewed (if reviewed) */
  reviewedBy?: string;
  /** Notes from staff review */
  reviewNotes?: string;
}

/**
 * Generate a unique report ID.
 */
function generateReportId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `report_${timestamp}_${random}`;
}

/**
 * Validate abuse report input.
 * Throws error if validation fails.
 *
 * @param input - Report input to validate
 */
function validateReportInput(input: AbuseReportInput): void {
  if (!input.reporterUuid || input.reporterUuid.trim() === '') {
    throw new Error('reporterUuid is required');
  }

  if (!input.targetMessageId || input.targetMessageId.trim() === '') {
    throw new Error('targetMessageId is required');
  }

  if (!input.targetUserUuid || input.targetUserUuid.trim() === '') {
    throw new Error('targetUserUuid is required');
  }

  if (!input.channelId || input.channelId.trim() === '') {
    throw new Error('channelId is required');
  }

  if (!input.reason || input.reason.trim() === '') {
    throw new Error('reason is required');
  }

  if (!ABUSE_REASONS.includes(input.reason)) {
    throw new Error(
      `Invalid abuse reason: ${input.reason}. Must be one of: ${ABUSE_REASONS.join(', ')}`,
    );
  }
}

/**
 * Create an abuse report.
 * Validates input and generates report record for moderation queue.
 *
 * @param input - Report details
 * @returns Created abuse report
 * @throws Error if validation fails
 */
export function createAbuseReport(input: AbuseReportInput): AbuseReport {
  validateReportInput(input);

  const report: AbuseReport = {
    id: generateReportId(),
    reporterUuid: input.reporterUuid,
    targetMessageId: input.targetMessageId,
    targetUserUuid: input.targetUserUuid,
    channelId: input.channelId,
    reason: input.reason,
    description: input.description,
    status: 'pending',
    createdAt: Date.now(),
  };

  return report;
}

/**
 * Update abuse report status.
 * Called by moderation system when staff takes action.
 *
 * @param report - The report to update
 * @param status - New status
 * @param reviewedBy - Staff member performing review
 * @param reviewNotes - Optional notes from staff
 * @returns Updated report
 */
export function updateReportStatus(
  report: AbuseReport,
  status: AbuseReportStatus,
  reviewedBy: string,
  reviewNotes?: string,
): AbuseReport {
  return {
    ...report,
    status,
    reviewedBy,
    reviewNotes,
    updatedAt: Date.now(),
  };
}
