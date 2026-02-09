/**
 * Chat messaging safety and moderation infrastructure.
 *
 * Exports:
 * - Rate limiting (ChatRateLimiter, CHAT_RATE_LIMITS)
 * - Abuse reporting (createAbuseReport, ABUSE_REASONS)
 * - Retention policy (isMessageExpired, filterExpiredMessages, RETENTION_POLICY)
 * - Feature flags (isChatEnabled, isDirectMessagingEnabled, DEFAULT_FLAGS)
 */

// Rate limiting
export {
  CHAT_RATE_LIMITS,
  ChatRateLimiter,
  type ChatRateLimitResult,
} from './chatRateLimiter';

// Abuse reporting
export {
  ABUSE_REASONS,
  type AbuseReason,
  type AbuseReport,
  type AbuseReportInput,
  type AbuseReportStatus,
  createAbuseReport,
  updateReportStatus,
} from './abuseReporting';

// Retention policy
export {
  filterExpiredMessages,
  getMessageExpirationDate,
  getRetentionWindowStart,
  isMessageExpired,
  RETENTION_POLICY,
} from './chatRetentionPolicy';

// Feature flags
export {
  type ChatFeatureFlags,
  DEFAULT_FLAGS,
  getDefaultFlags,
  getFlagsFromEnvironment,
  getFlagsWithDevOverrides,
  isChatEnabled,
  isDirectMessagingEnabled,
} from './chatFeatureFlags';
