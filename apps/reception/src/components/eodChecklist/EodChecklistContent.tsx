"use client";

import { useState } from "react";

import { useAuth } from "../../context/AuthContext";
import useInventoryLedger from "../../hooks/data/inventory/useInventoryLedger";
import { useTillShiftsData } from "../../hooks/data/till/useTillShiftsData";
import { useCashCountsData } from "../../hooks/data/useCashCountsData";
import { useEodClosureData } from "../../hooks/data/useEodClosureData";
import { useSafeCountsData } from "../../hooks/data/useSafeCountsData";
import { useCashCountsMutations } from "../../hooks/mutations/useCashCountsMutations";
import { useEodClosureMutations } from "../../hooks/mutations/useEodClosureMutations";
import { canAccess, Permissions } from "../../lib/roles";
import type { EodOverrideSignoff } from "../../schemas/eodClosureSchema";
import {
  endOfDayIso,
  formatItalyDateTimeFromIso,
  sameItalyDate,
  startOfDayIso,
} from "../../utils/dateUtils";

import EodOverrideModal from "./EodOverrideModal";
import OpeningFloatModal from "./OpeningFloatModal";

/**
 * Format a cash variance number as a signed Euro string.
 * Positive = over (€+X.XX), negative = short (€-X.XX), zero = €0.00.
 */
function formatCashVariance(amount: number): string {
  if (amount >= 0) {
    return `€+${amount.toFixed(2)}`;
  }
  return `€${amount.toFixed(2)}`;
}

export default function EodChecklistContent() {
  const { user } = useAuth();
  const canView = canAccess(user, Permissions.MANAGEMENT_ACCESS);
  const [showFloatModal, setShowFloatModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // All hooks must be called before any conditional return (React rules)
  // limitToLast raised from 10 to 20 to prevent silent undercount near midnight
  const { shifts, loading: tillLoading } = useTillShiftsData({
    limitToLast: 20,
  });
  const { safeCounts, loading: safeLoading } = useSafeCountsData({
    orderByChild: "timestamp",
    startAt: startOfDayIso(new Date()),
    endAt: endOfDayIso(new Date()),
  });
  const { cashCounts, loading: floatLoading } = useCashCountsData({
    orderByChild: "timestamp",
    startAt: startOfDayIso(new Date()),
    endAt: endOfDayIso(new Date()),
  });
  const { entries, loading: stockLoading } = useInventoryLedger();
  const { closure, loading: eodClosureLoading } = useEodClosureData();
  const { confirmDayClosed, confirmDayClosedWithOverride } = useEodClosureMutations();
  const { addOpeningFloatEntry } = useCashCountsMutations();

  if (!canView) return null;

  const openShifts = shifts.filter((s) => s.status !== "closed");
  const tillDone = openShifts.length === 0;

  const safeDone = safeCounts.some(
    (s) => s.type === "safeReconcile" || s.type === "reconcile"
  );

  const stockDone = entries.some(
    (e) => e.type === "count" && sameItalyDate(e.timestamp, new Date())
  );
  const floatDone = cashCounts.some(
    (c) => c.type === "openingFloat" && sameItalyDate(c.timestamp, new Date())
  );

  const allDone = tillDone && safeDone && stockDone;

  // Compute variance figures from data already in scope.
  // Filter to closed shifts with a closedAt timestamp on today's Italy date.
  const cashVariance = shifts
    .filter(
      (s) => s.status === "closed" && s.closedAt && sameItalyDate(s.closedAt, new Date())
    )
    .reduce((sum, s) => sum + (s.closeDifference ?? 0), 0);

  // Count distinct itemId values from count-type ledger entries for today.
  const stockItemsCounted = new Set(
    entries
      .filter((e) => e.type === "count" && sameItalyDate(e.timestamp, new Date()))
      .map((e) => e.itemId)
  ).size;

  if (!eodClosureLoading && closure !== null) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">End of Day</h1>
        <div
          className="rounded-lg border border-success-border bg-success-surface p-4"
          data-cy="day-closed-banner"
        >
          <p className="text-sm font-semibold text-success-fg">
            Day closed
          </p>
          <p className="text-sm text-muted-foreground">
            Confirmed by {closure.confirmedBy} at{" "}
            {formatItalyDateTimeFromIso(closure.timestamp)}
          </p>
          {typeof closure.cashVariance === "number" && (
            <p
              className="text-sm text-muted-foreground"
              data-cy="eod-closure-cash-variance"
            >
              Cash variance: {formatCashVariance(closure.cashVariance)}
            </p>
          )}
          {typeof closure.stockItemsCounted === "number" && (
            <p
              className="text-sm text-muted-foreground"
              data-cy="eod-closure-stock-items"
            >
              {closure.stockItemsCounted} items counted
            </p>
          )}
          {closure.overrideReason && (
            <div
              className="mt-2 rounded-md border border-warning-border bg-warning-surface p-3"
              data-cy="day-closed-override-note"
            >
              <p className="text-sm font-semibold text-warning-fg">
                Closed with manager override
              </p>
              {closure.overrideManagerName && (
                <p className="text-sm text-muted-foreground">
                  Authorised by {closure.overrideManagerName}
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Reason: {closure.overrideReason}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">
        End of Day
      </h1>

      <section className="rounded-lg border border-border-2 bg-surface p-4">
        <h2 className="mb-2 text-lg font-semibold text-foreground">Till</h2>
        {tillLoading ? (
          <p
            className="text-sm text-muted-foreground"
            data-cy="till-loading"
          >
            Loading...
          </p>
        ) : (
          <p
            className={
              tillDone ? "text-sm text-success-fg" : "text-sm text-danger-fg"
            }
            data-cy="till-status"
          >
            {tillDone ? "✓ Complete" : "✗ Incomplete"}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border-2 bg-surface p-4">
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Safe
        </h2>
        {safeLoading ? (
          <p
            className="text-sm text-muted-foreground"
            data-cy="safe-loading"
          >
            Loading...
          </p>
        ) : (
          <p
            className={
              safeDone ? "text-sm text-success-fg" : "text-sm text-danger-fg"
            }
            data-cy="safe-status"
          >
            {safeDone ? "✓ Complete" : "✗ Incomplete"}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border-2 bg-surface p-4">
        <h2 className="mb-2 text-lg font-semibold text-foreground">Stock</h2>
        {stockLoading ? (
          <p
            className="text-sm text-muted-foreground"
            data-cy="stock-loading"
          >
            Loading...
          </p>
        ) : (
          <p
            className={
              stockDone
                ? "text-sm text-success-fg"
                : "text-sm text-danger-fg"
            }
            data-cy="stock-status"
          >
            {stockDone ? "✓ Complete" : "✗ Incomplete"}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border-2 bg-surface p-4">
        <h2 className="mb-2 text-lg font-semibold text-foreground">Float</h2>
        {floatLoading ? (
          <p
            className="text-sm text-muted-foreground"
            data-cy="float-loading"
          >
            Loading...
          </p>
        ) : (
          <>
            <p
              className={
                floatDone
                  ? "text-sm text-success-fg"
                  : "text-sm text-danger-fg"
              }
              data-cy="float-status"
            >
              {floatDone ? "✓ Complete" : "✗ Incomplete"}
            </p>
            {!floatDone && (
              <button
                aria-expanded={showFloatModal}
                className="mt-3 rounded-lg border border-border-2 bg-surface px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-2 active:bg-surface-3"
                data-cy="float-set-button"
                onClick={() => setShowFloatModal(true)}
                type="button"
              >
                Set Opening Float
              </button>
            )}
          </>
        )}
      </section>

      {allDone && !eodClosureLoading && (
        <div
          className="rounded-lg border border-border-2 bg-surface p-4"
          data-cy="eod-variance-summary"
        >
          <p className="text-sm text-muted-foreground">
            Cash variance: {formatCashVariance(cashVariance)}
          </p>
          <p className="text-sm text-muted-foreground">
            {stockItemsCounted} items counted
          </p>
        </div>
      )}

      {allDone && !eodClosureLoading && (
        <button
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-fg hover:bg-primary-hover active:bg-primary-active"
          data-cy="confirm-day-closed"
          onClick={() => void confirmDayClosed({ cashVariance, stockItemsCounted })}
          type="button"
        >
          Confirm day closed
        </button>
      )}

      {!allDone && !eodClosureLoading && closure === null && (
        <button
          className="w-full rounded-lg border border-warning-border bg-warning-surface px-4 py-3 text-sm font-semibold text-warning-fg hover:opacity-80 active:opacity-70"
          data-cy="eod-override-button"
          onClick={() => setShowOverrideModal(true)}
          type="button"
        >
          Override &amp; close day
        </button>
      )}

      {showFloatModal && (
        <OpeningFloatModal
          onConfirm={addOpeningFloatEntry}
          onClose={() => setShowFloatModal(false)}
        />
      )}

      {showOverrideModal && (
        <EodOverrideModal
          onConfirm={(signoff: EodOverrideSignoff) => {
            void confirmDayClosedWithOverride(signoff);
            setShowOverrideModal(false);
          }}
          onCancel={() => setShowOverrideModal(false)}
        />
      )}
    </div>
  );
}
