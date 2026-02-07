import { firebaseBudgetBaselines } from '../../lib/firebase/budgetBaselines';
import { evaluateFirebaseFlowBudget, buildMetricsSnapshot } from '../../lib/firebase/budgetGate';

describe('firebase metrics budget baselines', () => {
  it('TC-01: pre-arrival budget tracks path-level read counts', () => {
    const report = evaluateFirebaseFlowBudget(
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

    expect(report.ok).toBe(true);
    expect(report.readCountsByPath.bookings).toBe(1);
    expect(report.readCountsByPath.completedTasks).toBe(1);
    expect(report.readCountsByPath.preordersData).toBe(1);
  });

  it('TC-02: each baseline includes rationale for budget governance', () => {
    for (const [flowId, flow] of Object.entries(firebaseBudgetBaselines.flows)) {
      expect(flowId).toBeTruthy();
      expect(flow.rationale.length).toBeGreaterThan(12);
    }
  });
});
