import { parseFirebaseBudgetBaselines } from '../budgetBaselines';
import {
  buildMetricsSnapshot,
  evaluateFirebaseFlowBudget,
  runFirebaseBudgetRegressionGate,
} from '../budgetGate';

describe('firebase budget regression gate', () => {
  it('TC-01: simulated budget exceedance causes non-zero regression gate result', () => {
    const inBudget = evaluateFirebaseFlowBudget(
      'verify_link_initial',
      buildMetricsSnapshot(['/api/guest-session']),
    );
    const exceeded = evaluateFirebaseFlowBudget(
      'portal_manual_refetch',
      buildMetricsSnapshot([
        'bookings/occ_1234567890123',
        'bookings/occ_1234567890123',
        'bookings/occ_1234567890123',
        'bookings/occ_1234567890123',
        'bookings/occ_1234567890123',
        'bookings/occ_1234567890123',
        'loans/room-12',
        'loans/room-12',
        'guestByRoom/room-12',
        'guestByRoom/room-12',
        'financialsRoom/BDC-123456',
        'financialsRoom/BDC-123456',
        'preordersData/occ_1234567890123',
      ], 2),
    );

    expect(runFirebaseBudgetRegressionGate([inBudget, exceeded])).toBe(1);
  });

  it('TC-02: baseline config parse errors fail fast with actionable message', () => {
    expect(() => {
      parseFirebaseBudgetBaselines({
        version: 1,
        flows: {
          broken: {
            maxReads: 'not-a-number',
            maxActiveListeners: 1,
            maxReadsByPath: {},
            rationale: 'invalid on purpose',
          },
        },
      });
    }).toThrow(/flows\.broken\.maxReads/);
  });

  it('TC-03: in-budget path returns zero regression gate result', () => {
    const preArrival = evaluateFirebaseFlowBudget(
      'portal_pre_arrival_initial',
      buildMetricsSnapshot([
        'bookings/occ_1234567890123',
        'completedTasks/occ_1234567890123',
        'loans/room-12',
        'guestByRoom/room-12',
        'financialsRoom/BDC-123456',
        'preordersData/occ_1234567890123',
        'cityTaxData/BDC-123456',
        'bagStorage/occ_1234567890123',
      ], 1),
    );
    const arrival = evaluateFirebaseFlowBudget(
      'arrival_mode_initial',
      buildMetricsSnapshot([
        'bookings/occ_1234567890123',
        'completedTasks/occ_1234567890123',
        'loans/room-12',
        'guestByRoom/room-12',
        'financialsRoom/BDC-123456',
        'preordersData/occ_1234567890123',
        'cityTaxData/BDC-123456',
        'bagStorage/occ_1234567890123',
        'checkInCode/BRK-ABCDE',
      ], 1),
    );

    expect(preArrival.ok).toBe(true);
    expect(arrival.ok).toBe(true);
    expect(runFirebaseBudgetRegressionGate([preArrival, arrival])).toBe(0);
  });
});
