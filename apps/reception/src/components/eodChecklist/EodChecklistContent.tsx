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
import {
  endOfDayIso,
  formatItalyDateTimeFromIso,
  sameItalyDate,
  startOfDayIso,
} from "../../utils/dateUtils";

import OpeningFloatModal from "./OpeningFloatModal";

export default function EodChecklistContent() {
  const { user } = useAuth();
  const canView = canAccess(user, Permissions.MANAGEMENT_ACCESS);
  const [showFloatModal, setShowFloatModal] = useState(false);

  // All hooks must be called before any conditional return (React rules)
  const { shifts, loading: tillLoading } = useTillShiftsData({
    limitToLast: 10,
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
  const { confirmDayClosed } = useEodClosureMutations();
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
        <button
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-fg hover:bg-primary-hover active:bg-primary-active"
          data-cy="confirm-day-closed"
          onClick={() => void confirmDayClosed()}
          type="button"
        >
          Confirm day closed
        </button>
      )}

      {showFloatModal && (
        <OpeningFloatModal
          onConfirm={addOpeningFloatEntry}
          onClose={() => setShowFloatModal(false)}
        />
      )}
    </div>
  );
}
