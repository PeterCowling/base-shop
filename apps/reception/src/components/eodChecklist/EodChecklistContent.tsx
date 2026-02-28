"use client";

import { useAuth } from "../../context/AuthContext";
import useInventoryLedger from "../../hooks/data/inventory/useInventoryLedger";
import { useTillShiftsData } from "../../hooks/data/till/useTillShiftsData";
import { useSafeCountsData } from "../../hooks/data/useSafeCountsData";
import { canAccess, Permissions } from "../../lib/roles";
import {
  endOfDayIso,
  sameItalyDate,
  startOfDayIso,
} from "../../utils/dateUtils";

export default function EodChecklistContent() {
  const { user } = useAuth();
  const canView = canAccess(user, Permissions.MANAGEMENT_ACCESS);

  // All hooks must be called before any conditional return (React rules)
  const { shifts, loading: tillLoading } = useTillShiftsData({
    limitToLast: 10,
  });
  const { safeCounts, loading: safeLoading } = useSafeCountsData({
    orderByChild: "timestamp",
    startAt: startOfDayIso(new Date()),
    endAt: endOfDayIso(new Date()),
  });
  const { entries, loading: stockLoading } = useInventoryLedger();

  if (!canView) return null;

  const openShifts = shifts.filter((s) => s.status !== "closed");
  const tillDone = openShifts.length === 0;

  const safeDone = safeCounts.some(
    (s) => s.type === "safeReconcile" || s.type === "reconcile"
  );

  const stockDone = entries.some(
    (e) => e.type === "count" && sameItalyDate(e.timestamp, new Date())
  );

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
    </div>
  );
}
