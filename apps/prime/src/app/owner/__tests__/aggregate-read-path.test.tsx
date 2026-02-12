/**
 * TASK-47 TC-02, TC-04: Owner read path contract tests
 *
 * Ensures owner dashboard reads only from pre-aggregated KPI nodes,
 * never performs raw booking scans, and stays within budget.
 */

import { type DailyKpiRecord,ZERO_SAFE_DEFAULTS } from '../../../lib/owner/kpiAggregator';

// Mock Firebase — declare with var so jest.mock hoisted factory can reference them
// eslint-disable-next-line no-var
var mockFirebaseGet = jest.fn();
// eslint-disable-next-line no-var
var mockFirebaseRef = jest.fn();
jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: mockFirebaseRef,
  get: mockFirebaseGet,
}));

// Import after mocking — must follow jest.mock for mock to be active
// eslint-disable-next-line import/first
import { readDailyKpi, readKpiRange } from '../../../lib/owner/kpiReader';

describe('Owner KPI read path contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirebaseRef.mockReturnValue('mock-ref');
  });

  it('TC-02: readDailyKpi reads from ownerKpis/{date} aggregate path only', async () => {
    const mockSnapshot = {
      exists: () => true,
      val: () => ({
        date: '2026-02-07',
        guestCount: 5,
        readinessCompletionPct: 85,
        etaSubmissionPct: 90,
        arrivalCodeGenPct: 100,
        medianCheckInLagMinutes: 45,
        extensionRequestCount: 2,
        bagDropRequestCount: 1,
        updatedAt: 1707312000000,
      }),
    };
    mockFirebaseGet.mockResolvedValue(mockSnapshot);

    const result = await readDailyKpi('2026-02-07');

    expect(result.guestCount).toBe(5);
    expect(result.readinessCompletionPct).toBe(85);

    // Verify that Firebase ref was called with ownerKpis path, NOT bookings path
    expect(mockFirebaseRef).toHaveBeenCalledWith(undefined, 'ownerKpis/2026-02-07');

    // Verify NO calls to bookings or preArrival paths
    const allCalls = mockFirebaseRef.mock.calls;
    const hasScanPath = allCalls.some(
      (call: unknown[]) =>
        typeof call[1] === 'string' &&
        (call[1].includes('bookings') || call[1].includes('preArrival')),
    );
    expect(hasScanPath).toBe(false);
  });

  it('TC-02: readDailyKpi returns zero-safe defaults for missing day', async () => {
    const mockSnapshot = {
      exists: () => false,
      val: () => null,
    };
    mockFirebaseGet.mockResolvedValue(mockSnapshot);

    const result = await readDailyKpi('2026-02-07');

    // Should return zero-safe defaults, NOT fallback to raw scans
    expect(result.guestCount).toBe(0);
    expect(result.readinessCompletionPct).toBe(0);
    expect(result.date).toBe('2026-02-07');

    // Verify NO calls to bookings or preArrival paths
    const allCalls = mockFirebaseRef.mock.calls;
    const hasScanPath = allCalls.some(
      (call: unknown[]) =>
        typeof call[1] === 'string' &&
        (call[1].includes('bookings') || call[1].includes('preArrival')),
    );
    expect(hasScanPath).toBe(false);
  });

  it('TC-02: readKpiRange reads only aggregate nodes, not raw bookings', async () => {
    const mockSnapshot = {
      exists: () => true,
      val: () => ({
        date: '2026-02-07',
        guestCount: 5,
        readinessCompletionPct: 85,
        etaSubmissionPct: 90,
        arrivalCodeGenPct: 100,
        medianCheckInLagMinutes: 45,
        extensionRequestCount: 2,
        bagDropRequestCount: 1,
        updatedAt: 1707312000000,
      }),
    };
    mockFirebaseGet.mockResolvedValue(mockSnapshot);

    const result = await readKpiRange('2026-02-07', '2026-02-09');

    // Should read 3 days: 2026-02-07, 2026-02-08, 2026-02-09
    expect(result.length).toBe(3);

    // All calls should be to ownerKpis path only
    const allCalls = mockFirebaseRef.mock.calls;
    const ownerKpisCalls = allCalls.filter(
      (call: unknown[]) => typeof call[1] === 'string' && call[1].startsWith('ownerKpis/'),
    );
    expect(ownerKpisCalls.length).toBe(3);

    // NO calls to bookings or preArrival paths
    const hasScanPath = allCalls.some(
      (call: unknown[]) =>
        typeof call[1] === 'string' &&
        (call[1].includes('bookings') || call[1].includes('preArrival')),
    );
    expect(hasScanPath).toBe(false);
  });

  it('TC-04: stays within defined read budget for 7-day window', async () => {
    const mockSnapshot = {
      exists: () => true,
      val: () => ZERO_SAFE_DEFAULTS,
    };
    mockFirebaseGet.mockResolvedValue(mockSnapshot);

    // Reading 7 days of KPIs
    await readKpiRange('2026-02-01', '2026-02-07');

    // Should require exactly 7 reads (one per day), NOT 7 * N_bookings reads
    expect(mockFirebaseGet).toHaveBeenCalledTimes(7);

    // All reads should be to ownerKpis aggregate path
    const allCalls = mockFirebaseRef.mock.calls;
    expect(allCalls.length).toBe(7);
    allCalls.forEach((call: unknown[]) => {
      expect(call[1]).toMatch(/^ownerKpis\/\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('TC-04: 30-day window stays within reasonable budget', async () => {
    const mockSnapshot = {
      exists: () => true,
      val: () => ZERO_SAFE_DEFAULTS,
    };
    mockFirebaseGet.mockResolvedValue(mockSnapshot);

    // Reading 30 days of KPIs
    await readKpiRange('2026-01-01', '2026-01-30');

    // Should require exactly 30 reads, not hundreds/thousands
    expect(mockFirebaseGet).toHaveBeenCalledTimes(30);

    // Budget threshold: 30 reads for 30 days is acceptable
    const READ_BUDGET_THRESHOLD = 50;
    expect((mockFirebaseGet as jest.Mock).mock.calls.length).toBeLessThanOrEqual(
      READ_BUDGET_THRESHOLD,
    );
  });

  it('readKpiRange handles partial data with zero-safe defaults', async () => {
    let callCount = 0;
    mockFirebaseGet.mockImplementation(async () => {
      callCount++;
      // First two days have data, rest are empty
      if (callCount <= 2) {
        return {
          exists: () => true,
          val: () => ({
            date: `2026-02-0${callCount + 6}`,
            guestCount: 5,
            readinessCompletionPct: 85,
            etaSubmissionPct: 90,
            arrivalCodeGenPct: 100,
            medianCheckInLagMinutes: 45,
            extensionRequestCount: 2,
            bagDropRequestCount: 1,
            updatedAt: 1707312000000,
          }),
        };
      }
      return {
        exists: () => false,
        val: () => null,
      };
    });

    const result = await readKpiRange('2026-02-07', '2026-02-09');

    expect(result.length).toBe(3);
    // First two have real data
    expect(result[0].guestCount).toBe(5);
    expect(result[1].guestCount).toBe(5);
    // Third is zero-safe default
    expect(result[2].guestCount).toBe(0);
    expect(result[2].date).toBe('2026-02-09');
  });
});
