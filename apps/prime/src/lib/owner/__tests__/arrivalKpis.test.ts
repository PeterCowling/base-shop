/**
 * TASK-48 TC-01, TC-02: Arrival KPI aggregation tests
 *
 * Tests that KPI aggregator computes expected percentages from fixtures,
 * returns zero-safe defaults for empty days, and uses pre-aggregated nodes.
 */

import {
  aggregateDailyKpis,
  type RawDayData,
  ZERO_SAFE_DEFAULTS,
} from '../kpiAggregator';

describe('Arrival KPI aggregation', () => {
  describe('TC-01: KPI aggregator computes expected percentages from fixtures', () => {
    it('computes readiness completion percentage correctly', () => {
      const rawData: RawDayData = {
        bookings: {
          booking1: {
            checkInDate: '2026-02-08',
            checkInCode: 'ABC123',
            occupants: {
              guest1: {
                preArrival: {
                  checklistProgress: {
                    routePlanned: true, // 25
                    etaConfirmed: true, // 20
                    cashPrepared: true, // 25
                    rulesReviewed: true, // 15
                    locationSaved: true, // 15
                  },
                  etaConfirmedAt: 1707312000000,
                },
              },
              guest2: {
                preArrival: {
                  checklistProgress: {
                    routePlanned: true, // 25
                    etaConfirmed: false, // 0
                    cashPrepared: true, // 25
                    rulesReviewed: false, // 0
                    locationSaved: true, // 15
                  },
                  etaConfirmedAt: 1707312000000,
                },
              },
            },
          },
        },
      };

      const result = aggregateDailyKpis('2026-02-08', rawData);

      // Guest1: 100, Guest2: 65 => Average: 82.5
      expect(result.readinessCompletionPct).toBeCloseTo(82.5, 1);
      expect(result.guestCount).toBe(2);
    });

    it('computes ETA submission percentage correctly', () => {
      const rawData: RawDayData = {
        bookings: {
          booking1: {
            checkInDate: '2026-02-08',
            checkInCode: 'ABC123',
            occupants: {
              guest1: {
                preArrival: {
                  etaConfirmedAt: 1707312000000,
                },
              },
              guest2: {
                preArrival: {
                  etaConfirmedAt: null,
                },
              },
              guest3: {
                preArrival: {},
              },
            },
          },
        },
      };

      const result = aggregateDailyKpis('2026-02-08', rawData);

      // 1 out of 3 guests confirmed ETA = 33.33%
      expect(result.etaSubmissionPct).toBeCloseTo(33.33, 1);
      expect(result.guestCount).toBe(3);
    });

    it('computes arrival-day code generation percentage correctly', () => {
      const rawData: RawDayData = {
        bookings: {
          booking1: {
            checkInDate: '2026-02-08',
            checkInCode: 'ABC123',
            occupants: {
              guest1: {},
            },
          },
          booking2: {
            checkInDate: '2026-02-08',
            checkInCode: null,
            occupants: {
              guest2: {},
            },
          },
          booking3: {
            checkInDate: '2026-02-08',
            occupants: {
              guest3: {},
            },
          },
        },
      };

      const result = aggregateDailyKpis('2026-02-08', rawData);

      // 1 out of 3 bookings has code = 33.33%
      expect(result.arrivalCodeGenPct).toBeCloseTo(33.33, 1);
    });

    it('computes median check-in lag correctly', () => {
      const rawData: RawDayData = {
        bookings: {
          booking1: {
            checkInDate: '2026-02-08',
            checkInCode: 'ABC123',
            // Check-in time is 15:00 on 2026-02-08
            // Check-in happened at 16:30 = 90 minutes lag
            checkInAt: new Date('2026-02-08T16:30:00Z').getTime(),
            occupants: { guest1: {} },
          },
          booking2: {
            checkInDate: '2026-02-08',
            checkInCode: 'DEF456',
            // Check-in happened at 15:45 = 45 minutes lag
            checkInAt: new Date('2026-02-08T15:45:00Z').getTime(),
            occupants: { guest2: {} },
          },
          booking3: {
            checkInDate: '2026-02-08',
            checkInCode: 'GHI789',
            // Check-in happened at 17:00 = 120 minutes lag
            checkInAt: new Date('2026-02-08T17:00:00Z').getTime(),
            occupants: { guest3: {} },
          },
        },
      };

      const result = aggregateDailyKpis('2026-02-08', rawData);

      // Lags: [90, 45, 120] => Median: 90
      expect(result.medianCheckInLagMinutes).toBe(90);
    });

    it('counts extension and bag drop requests correctly', () => {
      const rawData: RawDayData = {
        bookings: {
          booking1: {
            checkInDate: '2026-02-08',
            checkInCode: 'ABC123',
            occupants: {
              guest1: {
                extensionRequests: {
                  req1: { nights: 2 },
                  req2: { nights: 1 },
                },
                bagDropRequests: {
                  req1: { bags: 1 },
                },
              },
              guest2: {
                bagDropRequests: {
                  req1: { bags: 2 },
                  req2: { bags: 1 },
                },
              },
            },
          },
        },
      };

      const result = aggregateDailyKpis('2026-02-08', rawData);

      expect(result.extensionRequestCount).toBe(2);
      expect(result.bagDropRequestCount).toBe(3);
    });
  });

  describe('TC-02: Empty-day window returns zero-safe defaults', () => {
    it('returns zero-safe defaults for empty bookings object', () => {
      const rawData: RawDayData = {
        bookings: {},
      };

      const result = aggregateDailyKpis('2026-02-08', rawData);

      expect(result.date).toBe('2026-02-08');
      expect(result.guestCount).toBe(ZERO_SAFE_DEFAULTS.guestCount);
      expect(result.readinessCompletionPct).toBe(ZERO_SAFE_DEFAULTS.readinessCompletionPct);
      expect(result.etaSubmissionPct).toBe(ZERO_SAFE_DEFAULTS.etaSubmissionPct);
      expect(result.arrivalCodeGenPct).toBe(ZERO_SAFE_DEFAULTS.arrivalCodeGenPct);
      expect(result.medianCheckInLagMinutes).toBe(ZERO_SAFE_DEFAULTS.medianCheckInLagMinutes);
      expect(result.extensionRequestCount).toBe(ZERO_SAFE_DEFAULTS.extensionRequestCount);
      expect(result.bagDropRequestCount).toBe(ZERO_SAFE_DEFAULTS.bagDropRequestCount);
      expect(result.updatedAt).toBeDefined();
    });

    it('returns zero-safe defaults when no bookings match the date', () => {
      const rawData: RawDayData = {
        bookings: {
          booking1: {
            checkInDate: '2026-02-07', // Different date
            checkInCode: 'ABC123',
            occupants: { guest1: {} },
          },
        },
      };

      const result = aggregateDailyKpis('2026-02-08', rawData);

      expect(result.date).toBe('2026-02-08');
      expect(result.guestCount).toBe(0);
      expect(result.readinessCompletionPct).toBe(0);
    });

    it('handles division by zero when computing percentages', () => {
      const rawData: RawDayData = {
        bookings: {
          booking1: {
            checkInDate: '2026-02-08',
            occupants: {}, // No occupants
          },
        },
      };

      const result = aggregateDailyKpis('2026-02-08', rawData);

      // Should not crash, should return 0% for all percentages
      expect(result.guestCount).toBe(0);
      expect(result.etaSubmissionPct).toBe(0);
      expect(Number.isNaN(result.etaSubmissionPct)).toBe(false);
    });

    it('handles missing checklist progress gracefully', () => {
      const rawData: RawDayData = {
        bookings: {
          booking1: {
            checkInDate: '2026-02-08',
            checkInCode: 'ABC123',
            occupants: {
              guest1: {
                preArrival: {},
              },
              guest2: {},
            },
          },
        },
      };

      const result = aggregateDailyKpis('2026-02-08', rawData);

      // Both guests have 0 readiness score => 0% average
      expect(result.readinessCompletionPct).toBe(0);
      expect(result.guestCount).toBe(2);
    });
  });
});
