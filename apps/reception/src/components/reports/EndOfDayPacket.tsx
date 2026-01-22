/* src/components/reports/EndOfDayPacket.tsx */
import React, { useEffect, useRef, useState } from "react";
import {
  endAt as fbEndAt,
  get,
  orderByChild,
  query,
  ref,
  startAt as fbStartAt,
} from "firebase/database";

import { DISCREPANCY_LIMIT } from "../../constants/cash";
import { SafeDataProvider } from "../../context/SafeDataContext";
import { TillDataProvider } from "../../context/TillDataContext";
import { useEndOfDayReportData } from "../../hooks/data/useEndOfDayReportData";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { KeycardTransfer } from "../../types/hooks/data/keycardTransferData";
import type { SafeCount } from "../../types/hooks/data/safeCountData";
import {
  formatEnGbDateTimeFromIso,
  getItalyIsoString,
  subDays,
} from "../../utils/dateUtils";
import { formatEuro } from "../../utils/format";
import { showToast } from "../../utils/toastUtils";
import SmallSpinner from "../search/SmallSpinner";

import DailyTotals from "./DailyTotals";
import { type Column,SafeTable } from "./SafeTable";
import SafeTableSection from "./SafeTableSection";
import VarianceSummary from "./VarianceSummary";

interface EndOfDayPacketProps {
  /**
   * Date for which the report should be generated. If omitted, uses today's
   * date captured on initial render.
   */
  date?: Date;
  /**
   * Number of days prior to the report date to start loading safe data.
   * This ensures the most recent opening/reset before the report date is
   * included. If none is found within this range, the window is
   * automatically expanded (doubling the days up to a limit) until an
   * opening or reset is located. Defaults to 7 days.
   */
  safeLookbackDays?: number;
}

interface EndOfDayPacketContentProps {
  date: Date;
}

/**
 EndOfDayPacket component compiles daily totals, lists credit slip
 * entries recorded under `/creditSlips`, and calculates the variance
 * between expected and actual cash for the specified date.
 *
 * A simple "Print Packet" button calls window.print() so the user can
 * create a PDF or physical copy via the browser's print dialog.
 */
export const EndOfDayPacketContent: React.FC<EndOfDayPacketContentProps> = React.memo(
  function EndOfDayPacketContent({ date }) {
    const {
      targetDateStr,
      isLoading,
      tillError,
      cashDiscError,
      keycardDiscError,
      ccError,
      safeError,
      keycardTransfersError,
      totals,
      todaysIrregularities,
      todaysKeycardDiscrepancies,
      keycardDiscrepancyTotal,
      bankDrops,
      bankWithdrawals,
      deposits,
      withdrawals,
      pettyWithdrawals,
      drawerToSafeExchanges,
      safeToDrawerExchanges,
      todaysSafeReconciles,
      todaysSafeResets,
      reconcilesTotal,
      safeInflowsTotal,
      keycardTransfersToSafe,
      keycardTransfersFromSafe,
      safeKeycardInflowsTotal,
      safeKeycardOutflowsTotal,
      keycardReconcileAdjustment,
      tenderRemovalTotal,
      todaysCreditSlips,
      discrepancySummary,
      openingCash,
      expectedCash,
      closingCash,
      variance,
      openingKeycards,
      expectedKeycards,
      closingKeycards,
      keycardVariance,
      keycardVarianceMismatch,
      beginningSafeBalance,
      endingSafeBalance,
      expectedSafeVariance,
      safeVariance,
      safeVarianceMismatch,
      safeInflowsMismatch,
    } = useEndOfDayReportData(date);

    const drawerInflows = safeInflowsTotal - bankWithdrawals.total;

    const getSafeCountKey = (c: SafeCount, idx: number) =>
      c.id ?? c.timestamp ?? idx;

    const amountColumnsZero: Column<SafeCount>[] = [
      {
        header: "Time",
        render: (c) => formatEnGbDateTimeFromIso(c.timestamp),
      },
      {
        header: "Amount",
        render: (c) => formatEuro(c.amount || 0),
      },
      {
        header: "Keycards",
        render: (c) => c.keycardCount ?? 0,
      },
      {
        header: "Keycard Diff",
        render: (c) =>
          c.keycardDifference !== undefined ? (
            <span
              className={
                c.keycardDifference !== 0
                  ? "text-error-main font-semibold"
                  : undefined
              }
            >{`${c.keycardDifference >= 0 ? "+" : ""}${c.keycardDifference}`}</span>
          ) : (
            "0"
          ),
      },
      { header: "User", render: (c) => c.user },
    ];

    const amountColumnsDash: Column<SafeCount>[] = [
      {
        header: "Time",
        render: (c) => formatEnGbDateTimeFromIso(c.timestamp),
      },
      {
        header: "Amount",
        render: (c) => formatEuro(c.amount || 0),
      },
      {
        header: "Keycards",
        render: (c) => c.keycardCount ?? "-",
      },
      {
        header: "Keycard Diff",
        render: (c) =>
          c.keycardDifference !== undefined ? (
            <span
              className={
                c.keycardDifference !== 0
                  ? "text-error-main font-semibold"
                  : undefined
              }
            >{`${c.keycardDifference >= 0 ? "+" : ""}${c.keycardDifference}`}</span>
          ) : (
            "-"
          ),
      },
      { header: "User", render: (c) => c.user },
    ];

    const exchangeColumns: Column<SafeCount>[] = [
      {
        header: "Time",
        render: (c) => formatEnGbDateTimeFromIso(c.timestamp),
      },
      {
        header: "Amount",
        render: (c) => formatEuro(c.amount || 0),
      },
      { header: "User", render: (c) => c.user },
    ];

    const reconcileColumns: Column<SafeCount>[] = [
      {
        header: "Time",
        render: (c) => formatEnGbDateTimeFromIso(c.timestamp),
      },
      {
        header: "Count",
        render: (c) => formatEuro(c.count || 0),
      },
      {
        header: "Difference",
        render: (c) => formatEuro(c.difference || 0),
      },
      {
        header: "Keycards",
        render: (c) => c.keycardCount ?? "-",
      },
      {
        header: "Keycard Diff",
        render: (c) =>
          c.keycardDifference !== undefined ? (
            <span
              className={
                c.keycardDifference !== 0
                  ? "text-error-main font-semibold"
                  : undefined
              }
            >{`${c.keycardDifference >= 0 ? "+" : ""}${c.keycardDifference}`}</span>
          ) : (
            "-"
          ),
      },
      { header: "User", render: (c) => c.user },
    ];

    type KeycardTransferRow = KeycardTransfer & { id: number };
    const keycardTransferColumns: Column<KeycardTransferRow>[] = [
      {
        header: "Time",
        render: (t) => formatEnGbDateTimeFromIso(t.timestamp),
      },
      { header: "Count", render: (t) => t.count },
      { header: "User", render: (t) => t.user },
    ];

    const handlePrint = () => {
      window.print();
    };
    if (isLoading) {
      return (
        <div className="flex justify-center p-4">
          <SmallSpinner />
        </div>
      );
    }
    if (
      tillError ||
      cashDiscError ||
      keycardDiscError ||
      ccError ||
      safeError ||
      keycardTransfersError
    ) {
      return (
        <div className="p-2 bg-red-100 text-red-700 space-y-1">
          <>
            {tillError && <p>Error loading till data</p>}
            {cashDiscError && <p>Error loading cash discrepancies</p>}
            {keycardDiscError && <p>Error loading keycard discrepancies</p>}
            {ccError && <p>Error loading card irregularities</p>}
            {safeError && <p>Error loading safe counts</p>}
            {keycardTransfersError && <p>Error loading keycard transfers</p>}
          </>
        </div>
      );
    }

    return (
      <div className="p-4 bg-white text-gray-800 space-y-6 dark:bg-darkSurface dark:text-darkAccentGreen">
        <h2 className="text-2xl font-semibold">
          End of Day Packet for {targetDateStr}
        </h2>

        <DailyTotals totals={totals} />

        <section>
          <h3 className="text-xl font-semibold mb-2">
            CC Receipt Irregularities
          </h3>
          {todaysIrregularities.length === 0 ? (
            <p className="italic text-sm text-gray-600 dark:text-darkAccentGreen">No irregularities.</p>
          ) : (
            <table className="min-w-full border border-gray-400 text-sm dark:border-darkSurface">
              <thead>
                <tr className="bg-gray-100 dark:bg-darkSurface">
                  <th className="p-2 text-start border-b">Time</th>
                  <th className="p-2 text-start border-b">Action</th>
                  <th className="p-2 text-start border-b">Missing</th>
                </tr>
              </thead>
              <tbody>
                {todaysIrregularities.map((irr) => (
                  <tr
                    key={irr.timestamp}
                    className="odd:bg-gray-50 dark:odd:bg-darkSurface"
                  >
                    <td className="p-2">
                      {formatEnGbDateTimeFromIso(irr.timestamp)}
                    </td>
                    <td className="p-2 capitalize">{irr.action}</td>
                    <td className="p-2">{irr.missingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <SafeTableSection
          title={`Bank Drops (Total: ${formatEuro(bankDrops.total)})`}
          rows={bankDrops.rows}
          columns={amountColumnsZero}
          emptyMessage="No bank drops recorded."
          getRowKey={getSafeCountKey}
        />

        <SafeTableSection
          title={`Bank Withdrawals (Total: ${formatEuro(bankWithdrawals.total)})`}
          rows={bankWithdrawals.rows}
          columns={amountColumnsDash}
          emptyMessage="No bank withdrawals recorded."
          getRowKey={getSafeCountKey}
        />

        <SafeTableSection
          title={`Safe Deposits (Total: ${formatEuro(deposits.total)})`}
          rows={deposits.rows}
          columns={amountColumnsZero}
          emptyMessage="No deposits recorded."
          getRowKey={getSafeCountKey}
        />

        <SafeTableSection
          title={`Safe Withdrawals (Total: ${formatEuro(withdrawals.total)})`}
          rows={withdrawals.rows}
          columns={amountColumnsDash}
          emptyMessage="No withdrawals recorded."
          getRowKey={getSafeCountKey}
        />

        <SafeTableSection
          title={`Petty Cash Withdrawals (Total: ${formatEuro(pettyWithdrawals.total)})`}
          rows={pettyWithdrawals.rows}
          columns={amountColumnsDash}
          emptyMessage="No petty withdrawals recorded."
          getRowKey={getSafeCountKey}
        />

        <SafeTableSection
          title={`Drawer to Safe Exchanges (Total: ${formatEuro(drawerToSafeExchanges.total)})`}
          rows={drawerToSafeExchanges.rows}
          columns={exchangeColumns}
          emptyMessage="No drawer to safe exchanges recorded."
          getRowKey={getSafeCountKey}
        />

        <SafeTableSection
          title={`Safe to Drawer Exchanges (Total: ${formatEuro(safeToDrawerExchanges.total)})`}
          rows={safeToDrawerExchanges.rows}
          columns={exchangeColumns}
          emptyMessage="No safe to drawer exchanges recorded."
          getRowKey={getSafeCountKey}
        />

        {/* Safe inflows total includes bank withdrawals along with deposits and drawer-to-safe exchanges.
            Bank withdrawals are excluded from the comparison below. */}
        <p
          className={`text-sm ${
            safeInflowsMismatch ? "text-error-main font-semibold" : ""
          }`}
        >
          Safe Inflows (excl. Bank Withdrawals) vs Tender Removals: {formatEuro(
            drawerInflows
          )} vs {formatEuro(tenderRemovalTotal)}
        </p>

        <SafeTableSection
          title={`Safe Reconciliations (Δ${formatEuro(reconcilesTotal)})`}
          rows={todaysSafeReconciles}
          columns={reconcileColumns}
          emptyMessage="No safe reconciliations recorded."
          getRowKey={getSafeCountKey}
        />

        <SafeTableSection
          title="Safe Resets"
          rows={todaysSafeResets}
          columns={reconcileColumns}
          emptyMessage="No safe resets recorded."
          getRowKey={getSafeCountKey}
        />

        <section>
          <h3 className="text-xl font-semibold mb-2">
            Keycard Transfers to Safe (Total: {keycardTransfersToSafe.total})
          </h3>
          {keycardTransfersToSafe.rows.length === 0 ? (
            <p className="italic text-sm text-gray-600 dark:text-darkAccentGreen">
              No keycard transfers to the safe recorded.
            </p>
          ) : (
            <SafeTable
              columns={keycardTransferColumns}
              rows={keycardTransfersToSafe.rows.map((t, idx) => ({ ...t, id: idx }))}
            />
          )}
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            Keycard Transfers from Safe (Total: {keycardTransfersFromSafe.total})
          </h3>
          {keycardTransfersFromSafe.rows.length === 0 ? (
            <p className="italic text-sm text-gray-600 dark:text-darkAccentGreen">
              No keycard transfers from the safe recorded.
            </p>
          ) : (
            <SafeTable
              columns={keycardTransferColumns}
              rows={keycardTransfersFromSafe.rows.map((t, idx) => ({ ...t, id: idx }))}
            />
          )}
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Keycard Movements</h3>
          <table className="min-w-full border border-gray-400 text-sm dark:border-darkSurface">
            <tbody>
              <tr className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                <td className="p-2">Safe Inflows</td>
                <td className="p-2">{safeKeycardInflowsTotal}</td>
              </tr>
              <tr className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                <td className="p-2">Transfers to Safe</td>
                <td className="p-2">{keycardTransfersToSafe.total}</td>
              </tr>
              <tr className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                <td className="p-2">Safe Outflows</td>
                <td className="p-2">{safeKeycardOutflowsTotal}</td>
              </tr>
              <tr className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                <td className="p-2">Transfers from Safe</td>
                <td className="p-2">{keycardTransfersFromSafe.total}</td>
              </tr>
              <tr className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                <td className="p-2">Reconcile Adjustment</td>
                <td className="p-2">{keycardReconcileAdjustment}</td>
              </tr>
              <tr className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                <td className="p-2">Expected</td>
                <td className="p-2">{expectedKeycards}</td>
              </tr>
              <tr className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                <td className="p-2">Closing</td>
                <td className="p-2">{closingKeycards}</td>
              </tr>
              <tr className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                <td className="p-2">Variance</td>
                <td
                  className={`p-2 ${
                    keycardVarianceMismatch ? "text-error-main font-semibold" : ""
                  }`}
                >{`${keycardVariance >= 0 ? "+" : ""}${keycardVariance}`}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Credit Slip Registry</h3>
          {todaysCreditSlips.length === 0 ? (
            <p className="italic text-sm text-gray-600 dark:text-darkAccentGreen">
              No credit slips recorded.
            </p>
          ) : (
            <table className="min-w-full border border-gray-400 text-sm dark:border-darkSurface">
              <thead>
                <tr className="bg-gray-100 dark:bg-darkSurface">
                  <th className="p-2 text-start border-b">Time</th>
                  <th className="p-2 text-start border-b">Slip #</th>
                  <th className="p-2 text-start border-b">User</th>
                  <th className="p-2 text-start border-b">Amount</th>
                </tr>
              </thead>
              <tbody>
                {todaysCreditSlips.map((slip) => (
                  <tr
                    key={slip.slipNumber ?? slip.timestamp}
                    className="odd:bg-gray-50 dark:odd:bg-darkSurface"
                  >
                    <td className="p-2">
                      {formatEnGbDateTimeFromIso(slip.timestamp)}
                    </td>
                    <td className="p-2">{slip.slipNumber}</td>
                    <td className="p-2">{slip.user}</td>
                    <td className="p-2">{formatEuro(slip.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Discrepancies</h3>
          {keycardVarianceMismatch && (
            <p className="text-error-main font-semibold text-sm">
              Keycard variance: expected {expectedKeycards} vs actual {closingKeycards} (Δ
              {keycardVariance >= 0 ? "+" : ""}
              {keycardVariance})
            </p>
          )}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">
                Keycard Discrepancies (Total: {keycardDiscrepancyTotal})
              </h4>
              {todaysKeycardDiscrepancies.length === 0 ? (
                <p className="italic text-sm text-gray-600 dark:text-darkAccentGreen">
                  No keycard discrepancies.
                </p>
              ) : (
                <table className="min-w-full border border-gray-400 text-sm dark:border-darkSurface">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-darkSurface">
                      <th className="p-2 text-start border-b">Time</th>
                      <th className="p-2 text-start border-b">User</th>
                      <th className="p-2 text-start border-b">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysKeycardDiscrepancies.map((d, idx) => (
                      <tr key={idx} className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                        <td className="p-2">
                          {formatEnGbDateTimeFromIso(d.timestamp)}
                        </td>
                        <td className="p-2">{d.user}</td>
                        <td className="p-2">{d.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div>
              <h4 className="font-semibold">Cash Discrepancies</h4>
              {Object.keys(discrepancySummary).length === 0 ? (
                <p className="italic text-sm text-gray-600 dark:text-darkAccentGreen">
                  No cash discrepancies.
                </p>
              ) : (
                <table className="min-w-full border border-gray-400 text-sm dark:border-darkSurface">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-darkSurface">
                      <th className="p-2 text-start border-b">User</th>
                      <th className="p-2 text-start border-b">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(discrepancySummary).map(([u, amt]) => (
                      <tr key={u} className="odd:bg-gray-50 dark:odd:bg-darkSurface">
                        <td className="p-2">{u}</td>
                        <td
                          className={`p-2 ${
                            Math.abs(amt) >= DISCREPANCY_LIMIT
                              ? "text-error-main font-semibold"
                              : ""
                          }`}
                        >
                          {formatEuro(amt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        <VarianceSummary
          openingCash={openingCash}
          expectedCash={expectedCash}
          closingCash={closingCash}
          variance={variance}
          openingKeycards={openingKeycards}
          expectedKeycards={expectedKeycards}
          closingKeycards={closingKeycards}
          keycardVariance={keycardVariance}
          keycardVarianceMismatch={keycardVarianceMismatch}
          beginningSafeBalance={beginningSafeBalance}
          endingSafeBalance={endingSafeBalance}
          expectedSafeVariance={expectedSafeVariance}
          safeVariance={safeVariance}
          safeVarianceMismatch={safeVarianceMismatch}
        />

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
        >
          Print Packet
        </button>
      </div>
    );
  }
);

EndOfDayPacketContent.displayName = "EndOfDayPacketContent";

const EndOfDayPacket: React.FC<EndOfDayPacketProps> = ({
  date,
  safeLookbackDays = 7,
}) => {
  const dateRef = useRef(date ?? new Date());
  const reportDate = dateRef.current;
  const italyDate = getItalyIsoString(reportDate).slice(0, 10);
  const database = useFirebaseDatabase();
  const [startAt, setStartAt] = useState<string | null>(null);
  const endAt = `${italyDate}T23:59:59.000+00:00`;

  useEffect(() => {
    let cancelled = false;
    const maxDays = 365;

    async function determineStart() {
      let days = safeLookbackDays;
      while (days <= maxDays) {
        const lookback = subDays(reportDate, days);
        const candidate = `${
          getItalyIsoString(lookback).slice(0, 10)
        }T00:00:00.000+00:00`;
        try {
          const snap = await get(
            query(
              ref(database, "safeCounts"),
              orderByChild("timestamp"),
              fbStartAt(candidate),
              fbEndAt(endAt)
            )
          );
          const hasOpening =
            snap.exists() &&
            Object.values(snap.val() as Record<string, { type: string }>).some(
              (c) =>
                ["opening", "safeReset", "safeReconcile"].includes(c.type)
            );
          if (hasOpening || days >= maxDays) {
            if (!cancelled) setStartAt(candidate);
            return;
          }
          days *= 2;
        } catch (err) {
          console.error("Failed to determine safe start", err);
          if (!cancelled)
            showToast("Failed to load safe data for report", "error");
          return;
        }
      }
    }

    determineStart();
    return () => {
      cancelled = true;
    };
  }, [database, endAt, reportDate, safeLookbackDays]);

  return (
    <TillDataProvider reportDate={reportDate}>
      {startAt && (
        <SafeDataProvider startAt={startAt} endAt={endAt}>
          <EndOfDayPacketContent date={reportDate} />
        </SafeDataProvider>
      )}
    </TillDataProvider>
  );
};

export default EndOfDayPacket;
