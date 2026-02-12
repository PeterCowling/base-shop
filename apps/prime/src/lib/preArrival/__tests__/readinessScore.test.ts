/**
 * Tests for readinessScore.ts
 */

import {
  computeReadinessScore,
  getCompletedCount,
  getNextChecklistItem,
  getReadinessLevel,
  getReadinessMessageKey,
  getTotalChecklistItems,
  isChecklistComplete,
} from '../readinessScore';

describe('readinessScore', () => {
  const emptyChecklist = {
    routePlanned: false,
    etaConfirmed: false,
    cashPrepared: false,
    rulesReviewed: false,
    locationSaved: false,
  };

  const fullChecklist = {
    routePlanned: true,
    etaConfirmed: true,
    cashPrepared: true,
    rulesReviewed: true,
    locationSaved: true,
  };

  const partialChecklist = {
    routePlanned: true,
    etaConfirmed: true,
    cashPrepared: false,
    rulesReviewed: false,
    locationSaved: false,
  };

  describe('computeReadinessScore', () => {
    it('returns 0 for empty checklist', () => {
      expect(computeReadinessScore(emptyChecklist)).toBe(0);
    });

    it('returns 100 for complete checklist', () => {
      expect(computeReadinessScore(fullChecklist)).toBe(100);
    });

    it('returns correct weighted score for partial checklist', () => {
      // routePlanned (25) + etaConfirmed (20) = 45
      expect(computeReadinessScore(partialChecklist)).toBe(45);
    });

    it('applies correct weights to individual items', () => {
      // Test each item individually
      expect(computeReadinessScore({ ...emptyChecklist, routePlanned: true })).toBe(25);
      expect(computeReadinessScore({ ...emptyChecklist, etaConfirmed: true })).toBe(20);
      expect(computeReadinessScore({ ...emptyChecklist, cashPrepared: true })).toBe(25);
      expect(computeReadinessScore({ ...emptyChecklist, rulesReviewed: true })).toBe(15);
      expect(computeReadinessScore({ ...emptyChecklist, locationSaved: true })).toBe(15);
    });
  });

  describe('getCompletedCount', () => {
    it('returns 0 for empty checklist', () => {
      expect(getCompletedCount(emptyChecklist)).toBe(0);
    });

    it('returns 5 for full checklist', () => {
      expect(getCompletedCount(fullChecklist)).toBe(5);
    });

    it('returns correct count for partial checklist', () => {
      expect(getCompletedCount(partialChecklist)).toBe(2);
    });
  });

  describe('getTotalChecklistItems', () => {
    it('returns 5', () => {
      expect(getTotalChecklistItems()).toBe(5);
    });
  });

  describe('isChecklistComplete', () => {
    it('returns false for empty checklist', () => {
      expect(isChecklistComplete(emptyChecklist)).toBe(false);
    });

    it('returns true for full checklist', () => {
      expect(isChecklistComplete(fullChecklist)).toBe(true);
    });

    it('returns false for partial checklist', () => {
      expect(isChecklistComplete(partialChecklist)).toBe(false);
    });
  });

  describe('getNextChecklistItem', () => {
    it('returns routePlanned for empty checklist (first priority)', () => {
      expect(getNextChecklistItem(emptyChecklist)).toBe('routePlanned');
    });

    it('returns null for complete checklist', () => {
      expect(getNextChecklistItem(fullChecklist)).toBeNull();
    });

    it('returns first incomplete item in priority order', () => {
      // With route and ETA done, cash is next
      expect(getNextChecklistItem(partialChecklist)).toBe('cashPrepared');

      // With only route done, ETA is next
      const routeOnly = {
        ...emptyChecklist,
        routePlanned: true,
      };
      expect(getNextChecklistItem(routeOnly)).toBe('etaConfirmed');
    });
  });

  describe('getReadinessLevel', () => {
    it('returns not-started for score 0', () => {
      expect(getReadinessLevel(0)).toBe('not-started');
    });

    it('returns in-progress for score 1-49', () => {
      expect(getReadinessLevel(1)).toBe('in-progress');
      expect(getReadinessLevel(25)).toBe('in-progress');
      expect(getReadinessLevel(49)).toBe('in-progress');
    });

    it('returns almost-ready for score 50-99', () => {
      expect(getReadinessLevel(50)).toBe('almost-ready');
      expect(getReadinessLevel(75)).toBe('almost-ready');
      expect(getReadinessLevel(99)).toBe('almost-ready');
    });

    it('returns ready for score 100', () => {
      expect(getReadinessLevel(100)).toBe('ready');
    });
  });

  describe('getReadinessMessageKey', () => {
    it('returns correct i18n keys for each level', () => {
      expect(getReadinessMessageKey('not-started')).toBe('readiness.status.notStarted');
      expect(getReadinessMessageKey('in-progress')).toBe('readiness.status.inProgress');
      expect(getReadinessMessageKey('almost-ready')).toBe('readiness.status.almostReady');
      expect(getReadinessMessageKey('ready')).toBe('readiness.status.ready');
    });
  });
});
