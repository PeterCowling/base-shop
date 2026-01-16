/* src/components/till/ShiftSummary.tsx */

import { memo, useMemo } from "react";

import { ShiftSummaryProps } from "../../types/component/Till";
import { formatEnGbDateTime } from "../../utils/dateUtils";

/**
 * Renders an at-a-glance summary of the currently open till shift.
 *
 * ── Presentation ──────────────────────────────────────────────────────────
 * • Tailwind 4.1 utility classes provide a lightly frosted card (`bg-white/80`
 *   + `backdrop-blur-sm`) with a subtle shadow and dark-mode variants.
 * • Information is grouped into responsive grids (`1 / 2 / 3` columns) so the
 *   layout remains tidy from mobile upwards.
 * • A description list (`<dl>/<dt>/<dd>`) offers semantic pairing of labels
 *   and values while making the markup screen-reader-friendly.
 *
 * ── Behaviour ─────────────────────────────────────────────────────────────
 * • Nothing is rendered when no shift is active (`shiftOpenTime` is null).
 * • Monetary values are formatted once with `Intl.NumberFormat` (EUR) and
 *   memoised to avoid unnecessary instantiation.
 * • `Stat` is memoised separately to prevent needless re-renders.
 */
export const ShiftSummary = memo(function ShiftSummary({
  shiftOpenTime,
  shiftOwner,
  openingCash,
  finalCashCount,
  netCash,
  netCC,
  docDepositsCount,
  docReturnsCount,
  keycardsLoaned,
  creditSlipTotal,
  keycardsReturned,
  openingKeycards: _openingKeycards,
  finalKeycardCount,
  expectedKeycardsAtClose,
  expectedCashAtClose,
}: ShiftSummaryProps) {
  // Memoised currency formatter (Euro, en-GB locale).
  const euro = useMemo(
    () =>
      new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }),
    []
  );

  // Abort early if no active shift.
  if (!shiftOpenTime) return null;

  // Shared grid utilities for the three data blocks.
  const grid = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1";

  return (
    <section className="rounded-lg border border-gray-400 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-darkSurface dark:bg-darkBg">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-gray-800 dark:text-darkAccentGreen">
          Shift Summary
        </h2>

        <time
          dateTime={shiftOpenTime.toISOString()}
          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-darkAccentGreen"
        >
          {formatEnGbDateTime(shiftOpenTime, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </header>

      {/* Body */}
      <dl className="space-y-6">
        {/* ── Basic shift info ───────────────────────────────────────────── */}
        <div className={grid}>
          <Stat label="Owner" value={shiftOwner ?? "Unknown"} />
          <Stat label="Opening Cash" value={euro.format(openingCash)} />
        </div>

        {/* ── Transaction summary ───────────────────────────────────────── */}
        <div className={grid}>
          <Stat label="Net Cash" value={euro.format(netCash)} />
          <Stat label="Net CC" value={euro.format(netCC)} />
          <Stat label="Credit Slips" value={euro.format(creditSlipTotal)} />
          <Stat
            label="Doc Deposits / Returns"
            value={`${docDepositsCount} / ${docReturnsCount}`}
          />
          <Stat
            label="Keycards Loaned / Returned"
            value={`${keycardsLoaned} / ${keycardsReturned}`}
          />
        </div>

        {/* ── Closing info ──────────────────────────────────────────────── */}
        <div className={grid}>
          <Stat
            label="Expected Cash at Close"
            value={euro.format(expectedCashAtClose)}
          />
          <Stat label="Expected Keycards" value={expectedKeycardsAtClose} />
          {finalCashCount !== 0 && (
            <Stat
              label="Actual Cash Counted"
              value={euro.format(finalCashCount)}
            />
          )}
          {finalKeycardCount !== 0 && (
            <Stat label="Keycards Counted" value={finalKeycardCount} />
          )}
        </div>
      </dl>
    </section>
  );
});

/* ---------------------------------------------------------------------- */
/* Internal helper components                                             */
/* ---------------------------------------------------------------------- */

interface StatProps {
  label: string;
  value: string | number;
}

/**
 * Displays a single label/value pair within the summary.
 * Kept tiny, memoised, and free of inline object churn.
 */
const Stat = memo<StatProps>(function Stat({ label, value }) {
  return (
    <div className="flex items-start">
      <dt className="mr-1 font-medium text-gray-600 dark:text-darkAccentGreen">
        {label}:
      </dt>
      <dd className="text-gray-900 dark:text-darkAccentGreen">{value}</dd>
    </div>
  );
});
