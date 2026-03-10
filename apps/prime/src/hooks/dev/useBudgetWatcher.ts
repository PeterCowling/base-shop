/**
 * useBudgetWatcher
 *
 * Dev-only hook that compares a scoped window of Firebase reads against a
 * budget baseline. Fires a console.warn when reads exceed the budget for the
 * specified flow.
 *
 * The hook captures a delta snapshot between mount and the `isSettled`
 * transition — isolating reads from a single screen load. It is idempotent:
 * evaluation fires once per mount instance regardless of how many times
 * isSettled transitions to true.
 *
 * @remarks
 * - No-op in production (process.env.NODE_ENV guard inside the effects).
 * - Uses dynamic import for budgetGate.ts to ensure it is excluded from
 *   the production bundle via dead-code elimination.
 * - metricsSource defaults to the live firebaseMetrics singleton from
 *   @/services/firebase; inject a mock for testing.
 */

import { useEffect, useRef } from 'react';

import type { FirebaseBudgetFlowId } from '@/lib/firebase/budgetBaselines';
import { firebaseMetrics } from '@/services/firebase';

/** Injectable metrics source type — only getMetrics() is required. */
export type MetricsSource = Pick<typeof firebaseMetrics, 'getMetrics'>;

export interface UseBudgetWatcherOptions {
  /** When true, evaluation fires (transitions false→true trigger the check). */
  isSettled: boolean;
  /**
   * Injectable metrics source for testing.
   * Defaults to the live firebaseMetrics singleton from @/services/firebase.
   */
  metricsSource?: MetricsSource;
}

/**
 * useBudgetWatcher
 *
 * Call inside a 'use client' component to monitor Firebase read budgets.
 *
 * @example
 * useBudgetWatcher('portal_pre_arrival_initial', { isSettled: isInitialSyncComplete });
 */
export function useBudgetWatcher(
  flowId: FirebaseBudgetFlowId,
  options: UseBudgetWatcherOptions,
): void {
  const { isSettled, metricsSource } = options;
  const source: MetricsSource = metricsSource ?? firebaseMetrics;

  // Baseline index: captured at mount time via lazy initializer in useRef.
  // null signals "not yet initialized" — will be set in the mount effect.
  const baselineIndexRef = useRef<number | null>(null);

  // Idempotency guard: evaluation fires only once per mount instance.
  const hasEvaluatedRef = useRef(false);

  // Mount effect: capture baseline ASAP (before any isSettled effect).
  // Runs once on mount. No-op in production.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (baselineIndexRef.current === null) {
      baselineIndexRef.current = source.getMetrics().recentQueries.length;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- BRIK-2 source is stable ref; only run on mount [ttl=2026-12-31]
  }, []);

  // Settle effect: evaluate budget when isSettled transitions to true.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!isSettled || hasEvaluatedRef.current) return;
    // Baseline must be captured before we evaluate.
    if (baselineIndexRef.current === null) return;

    hasEvaluatedRef.current = true;

    const baselineIndex = baselineIndexRef.current;
    const currentMetrics = source.getMetrics();
    const deltaQueries = currentMetrics.recentQueries.slice(baselineIndex);
    const snapshot = {
      queryCount: deltaQueries.length,
      activeListeners: currentMetrics.activeListeners,
      recentQueries: deltaQueries,
    };

    // Dynamic import ensures budgetGate.ts is excluded from production bundles
    // via dead-code elimination — this branch is never reached in production.
    let isMounted = true;
    void import('@/lib/firebase/budgetGate').then(({ evaluateFirebaseFlowBudget }) => { // i18n-exempt -- BRIK-2 module path [ttl=2026-12-31]
      if (!isMounted) return;
      const report = evaluateFirebaseFlowBudget(flowId, snapshot);
      if (!report.ok) {
        console.warn('[Firebase Budget] Budget exceeded for flow:', flowId, report); // i18n-exempt -- BRIK-2 developer diagnostic [ttl=2026-12-31]
      }
    });
    return () => { isMounted = false; };
  }, [isSettled, flowId, source]);
}
