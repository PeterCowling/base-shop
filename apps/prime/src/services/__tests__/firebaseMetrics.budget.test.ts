import { firebaseBudgetBaselines } from '../../lib/firebase/budgetBaselines';
import { buildMetricsSnapshot,evaluateFirebaseFlowBudget } from '../../lib/firebase/budgetGate';

describe('firebase metrics budget baselines', () => {
  it('TC-01: pre-arrival budget tracks path-level read counts', () => {
    const report = evaluateFirebaseFlowBudget(
      'portal_pre_arrival_initial',
      buildMetricsSnapshot([
        'occupantIndex/occ_1234567890123',
        'bookings/BDC-123456/occ_1234567890123',
        'completedTasks/occ_1234567890123',
        'loans/room-12',
        'guestByRoom/room-12',
        'financialsRoom/BDC-123456',
        'preorder/occ_1234567890123',
        'cityTax/BDC-123456',
        'bagStorage/occ_1234567890123',
        'guestsDetails/occ_1234567890123',
      ], 1),
    );

    expect(report.ok).toBe(true);
    expect(report.readCountsByPath.occupantIndex).toBe(1);
    expect(report.readCountsByPath.bookings).toBe(1);
    expect(report.readCountsByPath.completedTasks).toBe(1);
    expect(report.readCountsByPath.preorder).toBe(1);
    expect(report.readCountsByPath.cityTax).toBe(1);
    expect(report.readCountsByPath.guestsDetails).toBe(1);
  });

  it('TC-02: each baseline includes rationale for budget governance', () => {
    for (const [flowId, flow] of Object.entries(firebaseBudgetBaselines.flows)) {
      expect(flowId).toBeTruthy();
      expect(flow.rationale.length).toBeGreaterThan(12);
    }
  });
});
