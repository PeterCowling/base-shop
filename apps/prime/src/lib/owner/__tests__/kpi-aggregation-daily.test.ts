/**
 * TASK-47 TC-01, TC-03: KPI aggregation tests
 *
 * Tests that daily KPI aggregation produces expected records from fixture data.
 */

import {
  aggregateDailyKpis,
  type DailyKpiRecord,
  ZERO_SAFE_DEFAULTS,
} from '../kpiAggregator';

describe('Owner KPI daily aggregation', () => {
  it('TC-01: computes readiness completion percentage from fixture data', () => {
    // Two guests with different readiness scores
    const fixtures = {
      bookings: {
        b1: {
          checkInDate: '2026-02-07',
          occupants: {
            occ1: {
              preArrival: {
                checklistProgress: {
                  routePlanned: true,
                  etaConfirmed: true,
                  cashPrepared: true,
                  rulesReviewed: true,
                  locationSaved: false,
                },
              },
            },
            occ2: {
              preArrival: {
                checklistProgress: {
                  routePlanned: true,
                  etaConfirmed: true,
                  cashPrepared: true,
                  rulesReviewed: true,
                  locationSaved: true,
                },
              },
            },
          },
        },
      },
    };

    const result = aggregateDailyKpis('2026-02-07', fixtures);

    // occ1: 25+20+25+15 = 85, occ2: 100
    // average: (85 + 100) / 2 = 92.5
    expect(result.readinessCompletionPct).toBe(92.5);
    expect(result.guestCount).toBe(2);
    expect(result.date).toBe('2026-02-07');
  });

  it('TC-01: computes ETA submission percentage', () => {
    const fixtures = {
      bookings: {
        b1: {
          checkInDate: '2026-02-07',
          occupants: {
            occ1: {
              preArrival: {
                etaConfirmedAt: 1707312000000, // has ETA
              },
            },
            occ2: {
              preArrival: {
                etaConfirmedAt: null, // no ETA
              },
            },
            occ3: {
              preArrival: {
                etaConfirmedAt: 1707312000000, // has ETA
              },
            },
          },
        },
      },
    };

    const result = aggregateDailyKpis('2026-02-07', fixtures);

    // 2 out of 3 guests submitted ETA
    expect(result.etaSubmissionPct).toBe((2 / 3) * 100);
    expect(result.guestCount).toBe(3);
  });

  it('TC-01: computes arrival code generation percentage', () => {
    const fixtures = {
      bookings: {
        b1: {
          checkInDate: '2026-02-07',
          checkInCode: 'BRK-ABC123',
          occupants: {
            occ1: {},
            occ2: {},
          },
        },
        b2: {
          checkInDate: '2026-02-07',
          checkInCode: null,
          occupants: {
            occ3: {},
          },
        },
      },
    };

    const result = aggregateDailyKpis('2026-02-07', fixtures);

    // 1 out of 2 bookings has check-in code
    expect(result.arrivalCodeGenPct).toBe(50);
    expect(result.guestCount).toBe(3);
  });

  it('TC-01: computes median check-in lag in minutes', () => {
    const checkInDate = '2026-02-07';
    const checkInDateTs = new Date(checkInDate + 'T15:00:00Z').getTime();

    const fixtures = {
      bookings: {
        b1: {
          checkInDate,
          checkInAt: checkInDateTs + 30 * 60 * 1000, // 30 min after
          occupants: {
            occ1: {},
          },
        },
        b2: {
          checkInDate,
          checkInAt: checkInDateTs + 60 * 60 * 1000, // 60 min after
          occupants: {
            occ2: {},
          },
        },
        b3: {
          checkInDate,
          checkInAt: checkInDateTs + 90 * 60 * 1000, // 90 min after
          occupants: {
            occ3: {},
          },
        },
      },
    };

    const result = aggregateDailyKpis('2026-02-07', fixtures);

    // Median of [30, 60, 90] = 60
    expect(result.medianCheckInLagMinutes).toBe(60);
  });

  it('TC-01: computes extension and bag drop request counts', () => {
    const fixtures = {
      bookings: {
        b1: {
          checkInDate: '2026-02-07',
          occupants: {
            occ1: {
              extensionRequests: {
                req1: { status: 'pending' },
                req2: { status: 'approved' },
              },
              bagDropRequests: {
                req1: { status: 'pending' },
              },
            },
            occ2: {
              extensionRequests: {
                req3: { status: 'rejected' },
              },
              bagDropRequests: {
                req2: { status: 'completed' },
                req3: { status: 'pending' },
              },
            },
          },
        },
      },
    };

    const result = aggregateDailyKpis('2026-02-07', fixtures);

    expect(result.extensionRequestCount).toBe(3);
    expect(result.bagDropRequestCount).toBe(3);
  });

  it('TC-03: returns zero-safe defaults for empty day', () => {
    const result = aggregateDailyKpis('2026-02-07', { bookings: {} });

    expect(result.date).toBe('2026-02-07');
    expect(result.guestCount).toBe(0);
    expect(result.readinessCompletionPct).toBe(0);
    expect(result.etaSubmissionPct).toBe(0);
    expect(result.arrivalCodeGenPct).toBe(0);
    expect(result.medianCheckInLagMinutes).toBe(0);
    expect(result.extensionRequestCount).toBe(0);
    expect(result.bagDropRequestCount).toBe(0);
    expect(typeof result.updatedAt).toBe('number');
  });

  it('TC-03: ZERO_SAFE_DEFAULTS has expected structure', () => {
    expect(ZERO_SAFE_DEFAULTS.guestCount).toBe(0);
    expect(ZERO_SAFE_DEFAULTS.readinessCompletionPct).toBe(0);
    expect(ZERO_SAFE_DEFAULTS.etaSubmissionPct).toBe(0);
    expect(ZERO_SAFE_DEFAULTS.arrivalCodeGenPct).toBe(0);
    expect(ZERO_SAFE_DEFAULTS.medianCheckInLagMinutes).toBe(0);
    expect(ZERO_SAFE_DEFAULTS.extensionRequestCount).toBe(0);
    expect(ZERO_SAFE_DEFAULTS.bagDropRequestCount).toBe(0);
  });

  it('aggregation handles missing occupant data gracefully', () => {
    const fixtures = {
      bookings: {
        b1: {
          checkInDate: '2026-02-07',
          occupants: {
            occ1: {
              // no preArrival data
            },
            occ2: {
              preArrival: null,
            },
          },
        },
      },
    };

    const result = aggregateDailyKpis('2026-02-07', fixtures);

    // Should not crash, should return zero-safe values
    expect(result.readinessCompletionPct).toBe(0);
    expect(result.etaSubmissionPct).toBe(0);
    expect(result.guestCount).toBe(2);
  });

  it('filters bookings by check-in date correctly', () => {
    const fixtures = {
      bookings: {
        b1: {
          checkInDate: '2026-02-07',
          occupants: {
            occ1: {},
          },
        },
        b2: {
          checkInDate: '2026-02-08', // different date
          occupants: {
            occ2: {},
          },
        },
        b3: {
          checkInDate: '2026-02-07',
          occupants: {
            occ3: {},
          },
        },
      },
    };

    const result = aggregateDailyKpis('2026-02-07', fixtures);

    // Only b1 and b3 should be included
    expect(result.guestCount).toBe(2);
  });
});
