/**
 * Tests for arrivalState.ts
 */

import {
  getGuestArrivalState,
  shouldShowPreArrivalDashboard,
  getArrivalStateLabel,
} from '../arrivalState';

// Note: These tests use actual date comparisons. For reliable testing,
// we test the function logic rather than mocking dates.

describe('arrivalState', () => {
  describe('getGuestArrivalState', () => {
    it('returns checked-in when isCheckedIn is true regardless of dates', () => {
      // Even if dates say pre-arrival, isCheckedIn overrides
      const state = getGuestArrivalState('2099-01-20', '2099-01-25', true);
      expect(state).toBe('checked-in');
    });

    it('returns pre-arrival when check-in date is far in the future', () => {
      // Use a date far in the future to avoid timezone edge cases
      const state = getGuestArrivalState('2099-01-20', '2099-01-25', false);
      expect(state).toBe('pre-arrival');
    });

    it('returns checked-out when checkout date is far in the past', () => {
      // Use a date far in the past
      const state = getGuestArrivalState('2000-01-05', '2000-01-10', false);
      expect(state).toBe('checked-out');
    });

    it('returns checked-in for current dates when not marked checked-in but past check-in', () => {
      // Past check-in but current checkout - should assume checked in
      const state = getGuestArrivalState('2000-01-10', '2099-01-20', false);
      expect(state).toBe('checked-in');
    });
  });

  describe('shouldShowPreArrivalDashboard', () => {
    it('returns true for pre-arrival state (future dates)', () => {
      const result = shouldShowPreArrivalDashboard('2099-01-20', '2099-01-25', false);
      expect(result).toBe(true);
    });

    it('returns false for checked-in state', () => {
      const result = shouldShowPreArrivalDashboard('2000-01-10', '2099-01-20', true);
      expect(result).toBe(false);
    });

    it('returns false for checked-out state', () => {
      const result = shouldShowPreArrivalDashboard('2000-01-05', '2000-01-10', false);
      expect(result).toBe(false);
    });
  });

  describe('getArrivalStateLabel', () => {
    it('returns correct labels for each state', () => {
      expect(getArrivalStateLabel('pre-arrival')).toBe('Pre-arrival');
      expect(getArrivalStateLabel('arrival-day')).toBe('Arrival day');
      expect(getArrivalStateLabel('checked-in')).toBe('Checked in');
      expect(getArrivalStateLabel('checked-out')).toBe('Checked out');
    });
  });
});
