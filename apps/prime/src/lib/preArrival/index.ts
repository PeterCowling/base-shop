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
  getTodayInBookingTimezone,
  compareDatesInTimezone,
  isDateToday,
  isDateInFuture,
  isDateInPast,
  getGuestArrivalState,
  shouldShowPreArrivalDashboard,
  getArrivalStateLabel,
} from './arrivalState';

// Readiness score computation
export {
  computeReadinessScore,
  getCompletedCount,
  getTotalChecklistItems,
  isChecklistComplete,
  getNextChecklistItem,
  getReadinessLevel,
  getReadinessMessageKey,
  type ReadinessLevel,
} from './readinessScore';

// Rate limiting
export {
  RATE_LIMIT_CONFIG,
  checkRateLimit,
  getRateLimitStatus,
  getRateLimitHeaders,
  startRateLimitCleanup,
  stopRateLimitCleanup,
  type RateLimitResult,
} from './rateLimiter';
