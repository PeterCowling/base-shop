import {
  assertFirebaseFlowBudget,
  buildMetricsSnapshot,
} from '../../../lib/firebase/budgetGate';

describe('firebase query budget contracts', () => {
  it('TC-01: initial pre-arrival load stays within read budget', () => {
    const metrics = buildMetricsSnapshot([
      'bookings/occ_1234567890123',
      'completedTasks/occ_1234567890123',
      'loans/room-12',
      'guestByRoom/room-12',
      'financialsRoom/BDC-123456',
      'preordersData/occ_1234567890123',
      'cityTaxData/BDC-123456',
      'bagStorage/occ_1234567890123',
    ], 1);

    expect(() => {
      assertFirebaseFlowBudget('portal_pre_arrival_initial', metrics);
    }).not.toThrow();
  });

  it('TC-02: arrival-day load stays within read budget including check-in path', () => {
    const metrics = buildMetricsSnapshot([
      'bookings/occ_1234567890123',
      'completedTasks/occ_1234567890123',
      'loans/room-12',
      'guestByRoom/room-12',
      'financialsRoom/BDC-123456',
      'preordersData/occ_1234567890123',
      'cityTaxData/BDC-123456',
      'bagStorage/occ_1234567890123',
      'checkInCode/BRK-ABCDE',
    ], 1);

    expect(() => {
      assertFirebaseFlowBudget('arrival_mode_initial', metrics);
    }).not.toThrow();
  });

  it('TC-03: manual refetch does not fan out duplicate parallel reads beyond budget', () => {
    const metrics = buildMetricsSnapshot([
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
      'cityTaxData/BDC-123456',
    ], 1);

    expect(() => {
      assertFirebaseFlowBudget('portal_manual_refetch', metrics);
    }).toThrow(/portal_manual_refetch/);
  });

  it('TC-04: cached query path does not trigger unnecessary reads', () => {
    const metrics = buildMetricsSnapshot([], 0);

    expect(() => {
      assertFirebaseFlowBudget('portal_cached_revisit', metrics);
    }).not.toThrow();
  });
});
