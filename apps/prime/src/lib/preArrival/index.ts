/**
 * Pre-arrival lib exports.
 *
 * This module provides pure functions for pre-arrival features:
 * - Arrival state determination (pre-arrival, arrival-day, etc.)
 * - Readiness score computation
 * - Rate limiting for find-booking API
 */

// Arrival state helpers
export {
  BOOKING_TIMEZONE,
  compareDatesInTimezone,
  getArrivalStateLabel,
  getGuestArrivalState,
  getTodayInBookingTimezone,
  isDateInFuture,
  isDateInPast,
  isDateToday,
  shouldShowPreArrivalDashboard,
} from './arrivalState';

// Readiness score computation
export {
  computeReadinessScore,
  getCompletedCount,
  getNextChecklistItem,
  getReadinessLevel,
  getReadinessMessageKey,
  getTotalChecklistItems,
  isChecklistComplete,
  type ReadinessLevel,
} from './readinessScore';

// Rate limiting
export {
  checkRateLimit,
  getRateLimitHeaders,
  getRateLimitStatus,
  RATE_LIMIT_CONFIG,
  type RateLimitResult,
  startRateLimitCleanup,
  stopRateLimitCleanup,
} from './rateLimiter';

// Keycard status derivation
export {
  deriveGuestKeycardStatus,
  type GuestKeycardStatus,
  type GuestKeycardStatusState,
} from './keycardStatus';

// Personalization helpers
export {
  getDefaultEtaWindow,
  getEtaWindowOptions,
  sortRoutesForPersonalization,
} from './personalization';

// Completion feedback helpers
export {
  getChecklistItemLabel,
  LAST_COMPLETED_CHECKLIST_ITEM_STORAGE_KEY,
  readLastCompletedChecklistItem,
  writeLastCompletedChecklistItem,
} from './completionFeedback';
