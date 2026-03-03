/* src/components/reports/EndOfDayPacket.tsx */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  endAt as fbEndAt,
  get,
  orderByChild,
  query,
  ref,
  startAt as fbStartAt,
} from "firebase/database";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { DISCREPANCY_LIMIT } from "../../constants/cash";
import { SafeDataProvider } from "../../context/SafeDataContext";
import { TillDataProvider } from "../../context/TillDataContext";
import { useTillShiftsRange } from "../../hooks/data/till/useTillShiftsRange";
import { useEndOfDayReportData } from "../../hooks/data/useEndOfDayReportData";
import { useKeycardAssignments } from "../../hooks/data/useKeycardAssignments";
import { useVarianceThresholds } from "../../hooks/data/useVarianceThresholds";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { KeycardTransfer } from "../../types/hooks/data/keycardTransferData";
import type { SafeCount } from "../../types/hooks/data/safeCountData";
import {
  endOfDayIso,
  formatEnGbDateTimeFromIso,
  getItalyIsoString,
  startOfDayIso,
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
      correctionSummary,
    } = useEndOfDayReportData(date);
    const { activeAssignments } = useKeycardAssignments();
    const unresolvedAssignments = useMemo(
      () =>
        activeAssignments.map((a) => ({
          keycardNumber: a.keycardNumber,
          roomNumber: a.roomNumber,
          occupantId: a.occupantId,
          bookingRef: a.bookingRef,
          assignedToStaff: a.assignedToStaff,
          isMasterKey: a.isMasterKey,
        })),
      [activeAssignments]
    );
    const { thresholds } = useVarianceThresholds();
    const { shifts, loading: shiftsLoading, error: shiftsError } =
      useTillShiftsRange({
        orderByChild: "closedAt",
        startAt: startOfDayIso(date),
        endAt: endOfDayIso(date),
      });
    const cashVarianceThreshold = thresholds.cash ?? DISCREPANCY_LIMIT;
    const pendingVarianceSignoffs = useMemo(
      () =>
        shifts.filter((shift) => {
          if (!shift.closedAt) return false;
          if (shift.closeType === "reconcile") return false;
          const diff = shift.closeDifference ?? 0;
          if (Math.abs(diff) <= cashVarianceThreshold) return false;
          return !shift.signedOffAt;
        }),
      [shifts, cashVarianceThreshold]
    );

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
        <div className="p-2 bg-error-light text-error-main space-y-1">
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
      <div className="p-4 bg-gradient-to-b from-surface-2 to-surface-3 text-foreground space-y-6">
        <h2 className="text-2xl font-semibold">
          End of Day Packet for {targetDateStr}
        </h2>

        <DailyTotals totals={totals} />
        <section>
          <h3 className="text-xl font-semibold mb-2">Corrections</h3>
          {correctionSummary.total === 0 ? (
            <p className="italic text-sm text-muted-foreground">
              No corrections recorded.
            </p>
          ) : (
            <div className="space-y-1 text-sm">
              <p>
                <strong>Entries:</strong> {correctionSummary.total}
              </p>
              <p>
                <strong>Net impact:</strong>{" "}
                {formatEuro(correctionSummary.netAmount)}
              </p>
              <p>
                <strong>Reversals:</strong> {correctionSummary.reversalCount}{" "}
                <strong>Replacements:</strong>{" "}
                {correctionSummary.replacementCount}{" "}
                <strong>Adjustments:</strong>{" "}
                {correctionSummary.adjustmentCount}
              </p>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            CC Receipt Irregularities
          </h3>
          {todaysIrregularities.length === 0 ? (
            <p className="italic text-sm text-muted-foreground">No irregularities.</p>
          ) : (
            <Table className="min-w-full border border-border-2 text-sm">
              <TableHeader>
                <TableRow className="bg-surface-2">
                  <TableHead className="p-2 text-start border-b">Time</TableHead>
                  <TableHead className="p-2 text-start border-b">Action</TableHead>
                  <TableHead className="p-2 text-start border-b">Missing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysIrregularities.map((irr) => (
                  <TableRow
                    key={irr.timestamp}
                    className="odd:bg-surface-2"
                  >
                    <TableCell className="p-2">
                      {formatEnGbDateTimeFromIso(irr.timestamp)}
                    </TableCell>
                    <TableCell className="p-2 capitalize">{irr.action}</TableCell>
                    <TableCell className="p-2">{irr.missingCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <p className="italic text-sm text-muted-foreground">
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
            <p className="italic text-sm text-muted-foreground">
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
          <Table className="min-w-full border border-border-2 text-sm">
            <TableBody>
              <TableRow className="odd:bg-surface-2">
                <TableCell className="p-2">Safe Inflows</TableCell>
                <TableCell className="p-2">{safeKeycardInflowsTotal}</TableCell>
              </TableRow>
              <TableRow className="odd:bg-surface-2">
                <TableCell className="p-2">Transfers to Safe</TableCell>
                <TableCell className="p-2">{keycardTransfersToSafe.total}</TableCell>
              </TableRow>
              <TableRow className="odd:bg-surface-2">
                <TableCell className="p-2">Safe Outflows</TableCell>
                <TableCell className="p-2">{safeKeycardOutflowsTotal}</TableCell>
              </TableRow>
              <TableRow className="odd:bg-surface-2">
                <TableCell className="p-2">Transfers from Safe</TableCell>
                <TableCell className="p-2">{keycardTransfersFromSafe.total}</TableCell>
              </TableRow>
              <TableRow className="odd:bg-surface-2">
                <TableCell className="p-2">Reconcile Adjustment</TableCell>
                <TableCell className="p-2">{keycardReconcileAdjustment}</TableCell>
              </TableRow>
              <TableRow className="odd:bg-surface-2">
                <TableCell className="p-2">Expected</TableCell>
                <TableCell className="p-2">{expectedKeycards}</TableCell>
              </TableRow>
              <TableRow className="odd:bg-surface-2">
                <TableCell className="p-2">Closing</TableCell>
                <TableCell className="p-2">{closingKeycards}</TableCell>
              </TableRow>
              <TableRow className="odd:bg-surface-2">
                <TableCell className="p-2">Variance</TableCell>
                <TableCell
                  className={`p-2 ${
                    keycardVarianceMismatch ? "text-error-main font-semibold" : ""
                  }`}
                >{`${keycardVariance >= 0 ? "+" : ""}${keycardVariance}`}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Credit Slip Registry</h3>
          {todaysCreditSlips.length === 0 ? (
            <p className="italic text-sm text-muted-foreground">
              No credit slips recorded.
            </p>
          ) : (
            <Table className="min-w-full border border-border-2 text-sm">
              <TableHeader>
                <TableRow className="bg-surface-2">
                  <TableHead className="p-2 text-start border-b">Time</TableHead>
                  <TableHead className="p-2 text-start border-b">Slip #</TableHead>
                  <TableHead className="p-2 text-start border-b">User</TableHead>
                  <TableHead className="p-2 text-start border-b">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysCreditSlips.map((slip) => (
                  <TableRow
                    key={slip.slipNumber ?? slip.timestamp}
                    className="odd:bg-surface-2"
                  >
                    <TableCell className="p-2">
                      {formatEnGbDateTimeFromIso(slip.timestamp)}
                    </TableCell>
                    <TableCell className="p-2">{slip.slipNumber}</TableCell>
                    <TableCell className="p-2">{slip.user}</TableCell>
                    <TableCell className="p-2">{formatEuro(slip.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                <p className="italic text-sm text-muted-foreground">
                  No keycard discrepancies.
                </p>
              ) : (
                <Table className="min-w-full border border-border-2 text-sm">
                  <TableHeader>
                    <TableRow className="bg-surface-2">
                      <TableHead className="p-2 text-start border-b">Time</TableHead>
                      <TableHead className="p-2 text-start border-b">User</TableHead>
                      <TableHead className="p-2 text-start border-b">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaysKeycardDiscrepancies.map((d, idx) => (
                      <TableRow key={idx} className="odd:bg-surface-2">
                        <TableCell className="p-2">
                          {formatEnGbDateTimeFromIso(d.timestamp)}
                        </TableCell>
                        <TableCell className="p-2">{d.user}</TableCell>
                        <TableCell className="p-2">{d.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div>
              <h4 className="font-semibold">Cash Discrepancies</h4>
              {Object.keys(discrepancySummary).length === 0 ? (
                <p className="italic text-sm text-muted-foreground">
                  No cash discrepancies.
                </p>
              ) : (
                <Table className="min-w-full border border-border-2 text-sm">
                  <TableHeader>
                    <TableRow className="bg-surface-2">
                      <TableHead className="p-2 text-start border-b">User</TableHead>
                      <TableHead className="p-2 text-start border-b">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(discrepancySummary).map(([u, amt]) => (
                      <TableRow key={u} className="odd:bg-surface-2">
                        <TableCell className="p-2">{u}</TableCell>
                        <TableCell
                          className={`p-2 ${
                            Math.abs(amt) >= DISCREPANCY_LIMIT
                              ? "text-error-main font-semibold"
                              : ""
                          }`}
                        >
                          {formatEuro(amt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Variance Sign-offs</h3>
          <p className="text-sm text-muted-foreground">
            Threshold: €{cashVarianceThreshold.toFixed(2)} (cash variance)
          </p>
          {shiftsLoading && (
            <p className="italic text-sm text-muted-foreground">
              Loading variance sign-offs...
            </p>
          )}
          {shiftsError && (
            <p className="text-error-main text-sm">
              Error loading variance sign-offs.
            </p>
          )}
          {!shiftsLoading && !shiftsError && pendingVarianceSignoffs.length === 0 && (
            <p className="italic text-sm text-muted-foreground">
              No pending variance sign-offs.
            </p>
          )}
          {!shiftsLoading && !shiftsError && pendingVarianceSignoffs.length > 0 && (
            <Table className="min-w-full border border-border-2 text-sm">
              <TableHeader>
                <TableRow className="bg-surface-2">
                  <TableHead className="p-2 text-start border-b">Shift ID</TableHead>
                  <TableHead className="p-2 text-start border-b">Closed</TableHead>
                  <TableHead className="p-2 text-start border-b">Closed By</TableHead>
                  <TableHead className="p-2 text-start border-b">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVarianceSignoffs.map((shift) => (
                  <TableRow
                    key={shift.shiftId}
                    className="odd:bg-surface-2"
                  >
                    <TableCell className="p-2">{shift.shiftId}</TableCell>
                    <TableCell className="p-2">
                      {shift.closedAt
                        ? formatEnGbDateTimeFromIso(shift.closedAt)
                        : "-"}
                    </TableCell>
                    <TableCell className="p-2">{shift.closedBy ?? "-"}</TableCell>
                    <TableCell className="p-2 text-error-main font-semibold">
                      {shift.closeDifference ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
          unresolvedAssignments={unresolvedAssignments}
          beginningSafeBalance={beginningSafeBalance}
          endingSafeBalance={endingSafeBalance}
          expectedSafeVariance={expectedSafeVariance}
          safeVariance={safeVariance}
          safeVarianceMismatch={safeVarianceMismatch}
        />

        <Button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-primary-main text-primary-fg rounded-lg hover:bg-primary-dark"
        >
          Print Packet
        </Button>
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
