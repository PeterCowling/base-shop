/**
 * useBudgetWatcher unit tests
 *
 * Coverage: happy path, violation detection, idempotency,
 * production no-op, and injectable metricsSource.
 */

import { act, renderHook } from '@testing-library/react';

import type { FirebaseMetricsSnapshot } from '../../../lib/firebase/budgetGate';
import type { MetricsSource } from '../useBudgetWatcher';
import { useBudgetWatcher } from '../useBudgetWatcher';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSnapshot(paths: string[], activeListeners = 0): FirebaseMetricsSnapshot {
  const now = Date.now();
  return {
    queryCount: paths.length,
    activeListeners,
    recentQueries: paths.map((path, i) => ({
      path,
      sizeBytes: 512,
      durationMs: 80,
      timestamp: now + i,
    })),
  };
}

function makeMetricsSource(initialPaths: string[] = []): MetricsSource & {
  addPaths: (...paths: string[]) => void;
} {
  const queries = makeSnapshot(initialPaths).recentQueries.slice();
  return {
    getMetrics: () => ({
      queryCount: queries.length,
      activeListeners: 0,
      recentQueries: queries.slice(),
    }),
    addPaths(...paths: string[]) {
      const now = Date.now();
      for (const p of paths) {
        queries.push({ path: p, sizeBytes: 512, durationMs: 80, timestamp: now });
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let originalNodeEnv: string | undefined;

beforeEach(() => {
  originalNodeEnv = process.env.NODE_ENV;
  // Reset to development for most tests — override in individual tests as needed
  Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
  jest.spyOn(console, 'warn').mockImplementation(() => { /* suppress */ });
});

afterEach(() => {
  Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, configurable: true });
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBudgetWatcher', () => {
  it('TC-01: no console.warn when reads are within budget', async () => {
    // portal_pre_arrival_initial allows 10 reads
    const source = makeMetricsSource();

    const { rerender } = renderHook(
      ({ isSettled }: { isSettled: boolean }) =>
        useBudgetWatcher('portal_pre_arrival_initial', { isSettled, metricsSource: source }),
      { initialProps: { isSettled: false } },
    );

    // Add 8 reads — well within the 10-read budget
    source.addPaths(
      'occupantIndex/occ_1', 'bookings/BDC-1/occ_1', 'completedTasks/occ_1',
      'loans/room-1', 'guestByRoom/room-1', 'financialsRoom/BDC-1',
      'preorder/occ_1', 'cityTax/BDC-1',
    );

    await act(async () => {
      rerender({ isSettled: true });
    });

    // Dynamic import is async — flush microtasks
    await act(async () => {
      await Promise.resolve();
    });

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('TC-02: console.warn fires when reads exceed budget', async () => {
    // portal_pre_arrival_initial allows 10 reads; we will add 13
    const source = makeMetricsSource();

    const { rerender } = renderHook(
      ({ isSettled }: { isSettled: boolean }) =>
        useBudgetWatcher('portal_pre_arrival_initial', { isSettled, metricsSource: source }),
      { initialProps: { isSettled: false } },
    );

    // 13 paths — 3 over budget
    source.addPaths(
      'occupantIndex/occ_1', 'bookings/BDC-1/occ_1', 'completedTasks/occ_1',
      'loans/room-1', 'guestByRoom/room-1', 'financialsRoom/BDC-1',
      'preorder/occ_1', 'cityTax/BDC-1', 'bagStorage/occ_1',
      'guestsDetails/occ_1',
      'extra/path-a', 'extra/path-b', 'extra/path-c',
    );

    await act(async () => {
      rerender({ isSettled: true });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(console.warn).toHaveBeenCalledWith(
      '[Firebase Budget] Budget exceeded for flow:',
      'portal_pre_arrival_initial',
      expect.objectContaining({ ok: false }),
    );
  });

  it('TC-03: idempotency — evaluation fires only once per mount even when isSettled toggles', async () => {
    const source = makeMetricsSource();

    const { rerender } = renderHook(
      ({ isSettled }: { isSettled: boolean }) =>
        useBudgetWatcher('portal_pre_arrival_initial', { isSettled, metricsSource: source }),
      { initialProps: { isSettled: false } },
    );

    // First settle
    await act(async () => {
      rerender({ isSettled: true });
    });
    await act(async () => { await Promise.resolve(); });

    const firstCallCount = (console.warn as jest.Mock).mock.calls.length;

    // Toggle back and settle again — must not trigger a second evaluation
    await act(async () => {
      rerender({ isSettled: false });
    });
    await act(async () => {
      rerender({ isSettled: true });
    });
    await act(async () => { await Promise.resolve(); });

    expect((console.warn as jest.Mock).mock.calls.length).toBe(firstCallCount);
  });

  it('TC-04: production no-op — warn never fires when NODE_ENV is production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });

    const source = makeMetricsSource();
    // Even with over-budget reads, production guard prevents evaluation
    source.addPaths(...Array.from({ length: 20 }, (_, i) => `path/item-${i}`));

    const { rerender } = renderHook(
      ({ isSettled }: { isSettled: boolean }) =>
        useBudgetWatcher('portal_pre_arrival_initial', { isSettled, metricsSource: source }),
      { initialProps: { isSettled: false } },
    );

    await act(async () => {
      rerender({ isSettled: true });
    });
    await act(async () => { await Promise.resolve(); });

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('TC-05: injectable metricsSource is used — default singleton is not called', async () => {
    // Verifies that the injected source (not the real firebaseMetrics singleton) is consulted.
    const source = makeMetricsSource();
    const getSpy = jest.spyOn(source, 'getMetrics');

    const { rerender } = renderHook(
      ({ isSettled }: { isSettled: boolean }) =>
        useBudgetWatcher('portal_pre_arrival_initial', { isSettled, metricsSource: source }),
      { initialProps: { isSettled: false } },
    );

    await act(async () => {
      rerender({ isSettled: true });
    });
    await act(async () => { await Promise.resolve(); });

    // getMetrics is called at mount (baseline capture) and at settle (delta capture)
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('TC-06: baseline is captured at mount — reads before mount are excluded from delta', async () => {
    // Pre-populate source with 5 reads that should NOT count (they existed before mount)
    const source = makeMetricsSource([
      'pre-mount/path-a', 'pre-mount/path-b', 'pre-mount/path-c',
      'pre-mount/path-d', 'pre-mount/path-e',
    ]);

    const { rerender } = renderHook(
      ({ isSettled }: { isSettled: boolean }) =>
        useBudgetWatcher('portal_pre_arrival_initial', { isSettled, metricsSource: source }),
      { initialProps: { isSettled: false } },
    );

    // Add exactly 10 reads post-mount (at the budget boundary)
    source.addPaths(
      'occupantIndex/occ_1', 'bookings/BDC-1/occ_1', 'completedTasks/occ_1',
      'loans/room-1', 'guestByRoom/room-1', 'financialsRoom/BDC-1',
      'preorder/occ_1', 'cityTax/BDC-1', 'bagStorage/occ_1', 'guestsDetails/occ_1',
    );

    await act(async () => {
      rerender({ isSettled: true });
    });
    await act(async () => { await Promise.resolve(); });

    // 10 post-mount reads == budget boundary → no violation
    expect(console.warn).not.toHaveBeenCalled();
  });
});
