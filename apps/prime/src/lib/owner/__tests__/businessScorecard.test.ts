/**
 * TASK-49 TC-01, TC-02: Business scorecard aggregation tests
 *
 * Tests that scorecard computes cross-app metrics accurately from TASK-47 aggregate fixtures
 * and handles missing data windows safely.
 */

import {
  type BusinessScorecardMetrics,
  computeBusinessScorecard,
  type MetricStatus,
  SCORECARD_TARGETS,
  type ScorecardTarget,
} from '../businessScorecard';
import { type DailyKpiRecord, ZERO_SAFE_DEFAULTS } from '../kpiAggregator';

describe('Business scorecard aggregation', () => {
  describe('TC-01: Scorecard computes metrics accurately from TASK-47 aggregate fixtures', () => {
    it('computes guest engagement metrics from 7-day fixture data', () => {
      const fixtures: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 8,
          readinessCompletionPct: 90,
          etaSubmissionPct: 87.5,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 25,
          extensionRequestCount: 1,
          bagDropRequestCount: 2,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 12,
          readinessCompletionPct: 80,
          etaSubmissionPct: 83.33,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 40,
          extensionRequestCount: 3,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
      ];

      const scorecard = computeBusinessScorecard(fixtures);

      // Guest engagement
      expect(scorecard.totalGuests).toBe(30);
      expect(scorecard.avgReadinessPct).toBeCloseTo(85, 1); // (85+90+80)/3
      expect(scorecard.avgEtaSubmissionPct).toBeCloseTo(86.94, 1); // (90+87.5+83.33)/3
      expect(scorecard.daysWithData).toBe(3);
    });

    it('computes staff efficiency metrics from fixture data', () => {
      const fixtures: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 8,
          readinessCompletionPct: 90,
          etaSubmissionPct: 87.5,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 25,
          extensionRequestCount: 1,
          bagDropRequestCount: 2,
          updatedAt: Date.now(),
        },
      ];

      const scorecard = computeBusinessScorecard(fixtures);

      // Staff efficiency
      expect(scorecard.avgCheckInLagMinutes).toBeCloseTo(27.5, 1); // (30+25)/2
      expect(scorecard.avgCodeGenerationPct).toBe(100);
      expect(scorecard.totalSupportRequests).toBe(6); // 2+1+1+2 = 6
    });

    it('computes business impact metrics from fixture data', () => {
      const fixtures: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 8,
          readinessCompletionPct: 90,
          etaSubmissionPct: 87.5,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 25,
          extensionRequestCount: 1,
          bagDropRequestCount: 2,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 0, // No guests
          readinessCompletionPct: 0,
          etaSubmissionPct: 0,
          arrivalCodeGenPct: 0,
          medianCheckInLagMinutes: 0,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
      ];

      const scorecard = computeBusinessScorecard(fixtures);

      // Business impact
      expect(scorecard.supportLoadPerGuest).toBeCloseTo(0.33, 2); // 6 requests / 18 guests
      expect(scorecard.daysWithData).toBe(2); // Only days with guestCount > 0
    });

    it('evaluates metric status against targets', () => {
      const fixtures: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 95, // Above target (90)
          etaSubmissionPct: 85, // Below target (90)
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 20, // Above target (15, lower is better)
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 10,
          readinessCompletionPct: 95,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 10,
          readinessCompletionPct: 95,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
      ];

      const scorecard = computeBusinessScorecard(fixtures);

      expect(scorecard.metrics.readiness.status).toBe('success');
      expect(scorecard.metrics.etaSubmission.status).toBe('warning');
      expect(scorecard.metrics.checkInLag.status).toBe('warning');
    });

    it('computes all metrics correctly for multi-week dataset', () => {
      const fixtures: DailyKpiRecord[] = Array.from({ length: 14 }, (_, i) => ({
        date: `2026-02-${String(i + 1).padStart(2, '0')}`,
        guestCount: 10 + i,
        readinessCompletionPct: 80 + i,
        etaSubmissionPct: 85 + i,
        arrivalCodeGenPct: 95 + i * 0.5,
        medianCheckInLagMinutes: 30 - i,
        extensionRequestCount: 1 + Math.floor(i / 2),
        bagDropRequestCount: 1,
        updatedAt: Date.now(),
      }));

      const scorecard = computeBusinessScorecard(fixtures);

      expect(scorecard.totalGuests).toBe(231); // sum of 10+11+...+23
      expect(scorecard.daysWithData).toBe(14);
      expect(scorecard.avgReadinessPct).toBeGreaterThan(80);
      expect(scorecard.avgEtaSubmissionPct).toBeGreaterThan(85);
    });
  });

  describe('TC-02: Missing data windows return safe defaults and explicit flags', () => {
    it('returns safe defaults for completely empty dataset', () => {
      const scorecard = computeBusinessScorecard([]);

      expect(scorecard.totalGuests).toBe(0);
      expect(scorecard.avgReadinessPct).toBe(0);
      expect(scorecard.avgEtaSubmissionPct).toBe(0);
      expect(scorecard.avgCodeGenerationPct).toBe(0);
      expect(scorecard.avgCheckInLagMinutes).toBe(0);
      expect(scorecard.totalSupportRequests).toBe(0);
      expect(scorecard.supportLoadPerGuest).toBe(0);
      expect(scorecard.daysWithData).toBe(0);
      expect(scorecard.hasInsufficientData).toBe(true);
    });

    it('returns safe defaults for dataset with all zero-guest days', () => {
      const fixtures: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          ...ZERO_SAFE_DEFAULTS,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          ...ZERO_SAFE_DEFAULTS,
          updatedAt: Date.now(),
        },
      ];

      const scorecard = computeBusinessScorecard(fixtures);

      expect(scorecard.totalGuests).toBe(0);
      expect(scorecard.daysWithData).toBe(0);
      expect(scorecard.hasInsufficientData).toBe(true);
    });

    it('flags insufficient data when less than 3 days have data', () => {
      const fixtures: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 8,
          readinessCompletionPct: 90,
          etaSubmissionPct: 87.5,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 25,
          extensionRequestCount: 1,
          bagDropRequestCount: 2,
          updatedAt: Date.now(),
        },
      ];

      const scorecard = computeBusinessScorecard(fixtures);

      expect(scorecard.daysWithData).toBe(2);
      expect(scorecard.hasInsufficientData).toBe(true);
    });

    it('does not flag insufficient data when 3+ days have data', () => {
      const fixtures: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 8,
          readinessCompletionPct: 90,
          etaSubmissionPct: 87.5,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 25,
          extensionRequestCount: 1,
          bagDropRequestCount: 2,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 12,
          readinessCompletionPct: 80,
          etaSubmissionPct: 83.33,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 40,
          extensionRequestCount: 3,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
      ];

      const scorecard = computeBusinessScorecard(fixtures);

      expect(scorecard.daysWithData).toBe(3);
      expect(scorecard.hasInsufficientData).toBe(false);
    });

    it('sets metric status to "unknown" when insufficient data', () => {
      const scorecard = computeBusinessScorecard([]);

      expect(scorecard.metrics.readiness.status).toBe('unknown');
      expect(scorecard.metrics.etaSubmission.status).toBe('unknown');
      expect(scorecard.metrics.codeGeneration.status).toBe('unknown');
      expect(scorecard.metrics.checkInLag.status).toBe('unknown');
      expect(scorecard.metrics.supportLoad.status).toBe('unknown');
    });
  });

  describe('Scorecard targets and thresholds', () => {
    it('SCORECARD_TARGETS defines all required targets', () => {
      expect(SCORECARD_TARGETS.readiness).toBeDefined();
      expect(SCORECARD_TARGETS.readiness.target).toBe(90);
      expect(SCORECARD_TARGETS.readiness.metric).toBe('Guest Readiness Completion');

      expect(SCORECARD_TARGETS.etaSubmission).toBeDefined();
      expect(SCORECARD_TARGETS.etaSubmission.target).toBe(90);

      expect(SCORECARD_TARGETS.codeGeneration).toBeDefined();
      expect(SCORECARD_TARGETS.codeGeneration.target).toBe(100);

      expect(SCORECARD_TARGETS.checkInLag).toBeDefined();
      expect(SCORECARD_TARGETS.checkInLag.target).toBe(15);

      expect(SCORECARD_TARGETS.supportLoad).toBeDefined();
      expect(SCORECARD_TARGETS.supportLoad.target).toBe(0.2);
    });

    it('evaluates status correctly for readiness metric', () => {
      const aboveTarget: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 95,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 10,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 10,
          readinessCompletionPct: 93,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 10,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 10,
          readinessCompletionPct: 92,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 10,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
      ];

      const scorecard = computeBusinessScorecard(aboveTarget);
      expect(scorecard.metrics.readiness.status).toBe('success');

      const belowTarget: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 75,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 10,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 10,
          readinessCompletionPct: 80,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 10,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 10,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
      ];

      const scorecardBelow = computeBusinessScorecard(belowTarget);
      expect(scorecardBelow.metrics.readiness.status).toBe('warning');
    });

    it('evaluates status correctly for check-in lag (lower is better)', () => {
      const aboveTarget: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 90,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 10,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 10,
          readinessCompletionPct: 90,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 12,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 10,
          readinessCompletionPct: 90,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 14,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
      ];

      const scorecard = computeBusinessScorecard(aboveTarget);
      expect(scorecard.metrics.checkInLag.status).toBe('success');

      const belowTarget: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 90,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 10,
          readinessCompletionPct: 90,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 25,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 10,
          readinessCompletionPct: 90,
          etaSubmissionPct: 90,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 0,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
      ];

      const scorecardBelow = computeBusinessScorecard(belowTarget);
      expect(scorecardBelow.metrics.checkInLag.status).toBe('warning');
    });
  });
});
