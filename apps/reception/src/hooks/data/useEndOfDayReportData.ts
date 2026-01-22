/* src/hooks/data/useEndOfDayReportData.ts */

import { useMemo } from "react";

import { useSafeData } from "../../context/SafeDataContext";
import { useTillData } from "../../context/TillDataContext";
import type { CreditSlip } from "../../types/component/Till";
import type { CardIrregularity } from "../../types/hooks/data/cardIrregularityData";
import type { CashDiscrepancy } from "../../types/hooks/data/cashDiscrepancyData";
import type { KeycardDiscrepancy } from "../../types/hooks/data/keycardDiscrepancyData";
import type { KeycardTransfer } from "../../types/hooks/data/keycardTransferData";
import type { SafeCount } from "../../types/hooks/data/safeCountData";
import {
  endOfDayIso,
  getItalyIsoString,
  parseYMD,
  sameItalyDate,
  startOfDayIso,
} from "../../utils/dateUtils";
import { partitionSafeCountsByType } from "../../utils/partitionSafeCountsByType";

import { calculateKeycardTransfers } from "./endOfDay/keycardTransfers";
import { calculateSafeTotals } from "./endOfDay/safeTotals";
import {
  calculateCashVariance,
  calculateKeycardVariance,
  calculateSafeVariance,
} from "./endOfDay/variance";
import { useCashDiscrepanciesData } from "./useCashDiscrepanciesData";
import { useCCIrregularitiesData } from "./useCCIrregularitiesData";
import { useKeycardDiscrepanciesData } from "./useKeycardDiscrepanciesData";
import { useKeycardTransfersData } from "./useKeycardTransfersData";

export interface SafeTableData {
  rows: SafeCount[];
  total: number;
}

export interface KeycardTransferTableData {
  rows: KeycardTransfer[];
  total: number;
}

export interface EndOfDayReportData {
  targetDateStr: string;
  isLoading: boolean;
  tillError: unknown;
  cashDiscError: unknown;
  keycardDiscError: unknown;
  ccError: unknown;
  safeError: unknown;
  keycardTransfersError: unknown;
  totals: { cash: number; card: number; other: number };
  todaysIrregularities: CardIrregularity[];
  bankDrops: SafeTableData;
  bankWithdrawals: SafeTableData;
  deposits: SafeTableData;
  withdrawals: SafeTableData;
  pettyWithdrawals: SafeTableData;
  drawerToSafeExchanges: SafeTableData;
  safeToDrawerExchanges: SafeTableData;
  todaysSafeReconciles: SafeCount[];
  todaysSafeResets: SafeCount[];
  reconcilesTotal: number;
  safeInflowsTotal: number;
  safeOutflowsTotal: number;
  safeKeycardInflowsTotal: number;
  safeKeycardOutflowsTotal: number;
  keycardTransfersToSafe: KeycardTransferTableData;
  keycardTransfersFromSafe: KeycardTransferTableData;
  todaysCreditSlips: CreditSlip[];
  discrepancySummary: Record<string, number>;
  todaysKeycardDiscrepancies: KeycardDiscrepancy[];
  keycardDiscrepancyTotal: number;
  openingCash: number;
  closingCash: number;
  floatTotal: number;
  tenderRemovalTotal: number;
  drawerToSafeExchangesTotal: number;
  safeToDrawerExchangesTotal: number;
  expectedCash: number;
  variance: number;
  openingKeycards: number;
  expectedKeycards: number;
  keycardReconcileAdjustment: number;
  closingKeycards: number;
  keycardVariance: number;
  keycardVarianceMismatch: boolean;
  beginningSafeBalance: number;
  endingSafeBalance: number;
  expectedSafeVariance: number;
  safeVariance: number;
  safeVarianceMismatch: boolean;
  safeInflowsMismatch: boolean;
}

export function useEndOfDayReportData(date: Date): EndOfDayReportData {
  const {
    transactions,
    cashCounts,
    creditSlips,
    loading: tillLoading,
    error: tillError,
  } = useTillData();
  const {
    cashDiscrepancies,
    loading: cashDiscLoading,
    error: cashDiscError,
  } = useCashDiscrepanciesData();
  const {
    keycardDiscrepancies,
    loading: keycardDiscLoading,
    error: keycardDiscError,
  } = useKeycardDiscrepanciesData();
  const {
    ccIrregularities,
    loading: ccLoading,
    error: ccError,
  } = useCCIrregularitiesData();
  const {
    transfers,
    loading: keycardTransfersLoading,
    error: keycardTransfersError,
  } = useKeycardTransfersData();

  const targetDateStr = useMemo(
    () => getItalyIsoString(date).slice(0, 10),
    [date]
  );
  const {
    safeCounts,
    getSafeBalanceAt,
    loading: safeLoading,
    error: safeError,
  } = useSafeData();

  const isLoading =
    tillLoading ||
    cashDiscLoading ||
    keycardDiscLoading ||
    ccLoading ||
    keycardTransfersLoading ||
    safeLoading;

  const totals = useMemo(() => {
    let cash = 0;
    let card = 0;
    let other = 0;
    for (const t of transactions) {
      if (t.timestamp && !sameItalyDate(t.timestamp, targetDateStr)) continue;
      const method = t.method?.toLowerCase();
      if (method === "cash") {
        cash += t.amount;
      } else if (method === "cc" || method === "card") {
        card += t.amount;
      } else {
        other += t.amount;
      }
    }
    return { cash, card, other };
  }, [transactions, targetDateStr]);

  const {
    bankDrops: todaysBankDrops,
    bankWithdrawals: todaysBankWithdrawals,
    deposits: todaysDeposits,
    withdrawals: todaysWithdrawals,
    pettyWithdrawals: todaysPettyWithdrawals,
    safeReconciles: todaysSafeReconciles,
    drawerToSafeExchanges: todaysDrawerToSafeExchanges,
    safeToDrawerExchanges: todaysSafeToDrawerExchanges,
  } = useMemo(
    () => partitionSafeCountsByType(safeCounts, targetDateStr),
    [safeCounts, targetDateStr]
  );

  const todaysSafeResets = useMemo(
    () =>
      safeCounts.filter(
        (c) => c.type === "safeReset" && sameItalyDate(c.timestamp, targetDateStr)
      ),
    [safeCounts, targetDateStr]
  );

  const safeTotals = useMemo(
    () =>
      calculateSafeTotals({
        bankDrops: todaysBankDrops,
        bankWithdrawals: todaysBankWithdrawals,
        deposits: todaysDeposits,
        withdrawals: todaysWithdrawals,
        pettyWithdrawals: todaysPettyWithdrawals,
        safeReconciles: todaysSafeReconciles,
        drawerToSafeExchanges: todaysDrawerToSafeExchanges,
        safeToDrawerExchanges: todaysSafeToDrawerExchanges,
      }),
    [
      todaysBankDrops,
      todaysBankWithdrawals,
      todaysDeposits,
      todaysWithdrawals,
      todaysPettyWithdrawals,
      todaysSafeReconciles,
      todaysDrawerToSafeExchanges,
      todaysSafeToDrawerExchanges,
    ]
  );

  const {
    bankDropsTotal,
    bankWithdrawalsTotal,
    depositsTotal,
    withdrawalsTotal,
    pettyWithdrawalsTotal,
    reconcilesTotal,
    drawerToSafeExchangesTotal,
    safeToDrawerExchangesTotal,
    safeInflowsTotal,
    safeOutflowsTotal,
  } = safeTotals;
  const safeKeycardInflowsBase = safeTotals.safeKeycardInflowsTotal;
  const safeKeycardOutflowsBase = safeTotals.safeKeycardOutflowsTotal;
  const drawerToSafeExchangesKeycards = safeTotals.drawerToSafeExchangesKeycards;
  const safeToDrawerExchangesKeycards = safeTotals.safeToDrawerExchangesKeycards;

  const {
    todaysTransfersToSafe,
    todaysTransfersFromSafe,
    keycardTransfersToSafeTotal,
    keycardTransfersFromSafeTotal,
  } = useMemo(
    () => calculateKeycardTransfers(transfers, targetDateStr),
    [transfers, targetDateStr]
  );
  const safeKeycardInflowsTotal = useMemo(
    () => safeKeycardInflowsBase + keycardTransfersToSafeTotal,
    [safeKeycardInflowsBase, keycardTransfersToSafeTotal]
  );
  const safeKeycardOutflowsTotal = useMemo(
    () => safeKeycardOutflowsBase + keycardTransfersFromSafeTotal,
    [safeKeycardOutflowsBase, keycardTransfersFromSafeTotal]
  );
  const safeKeycardInflowsForVariance = useMemo(
    () => safeKeycardInflowsTotal + drawerToSafeExchangesKeycards,
    [safeKeycardInflowsTotal, drawerToSafeExchangesKeycards]
  );
  const safeKeycardOutflowsForVariance = useMemo(
    () => safeKeycardOutflowsTotal + safeToDrawerExchangesKeycards,
    [safeKeycardOutflowsTotal, safeToDrawerExchangesKeycards]
  );

  const keycardReconcileAdjustment = useMemo(
    () =>
      [...todaysSafeReconciles, ...todaysSafeResets].reduce(
        (sum, c) => sum + (c.keycardDifference ?? 0),
        0
      ),
    [todaysSafeReconciles, todaysSafeResets]
  );

  const todaysCreditSlips = useMemo<CreditSlip[]>(
    () => creditSlips.filter((s) => sameItalyDate(s.timestamp, targetDateStr)),
    [creditSlips, targetDateStr]
  );

  const todaysIrregularities = useMemo<CardIrregularity[]>(
    () =>
      ccIrregularities.filter((i) => sameItalyDate(i.timestamp, targetDateStr)),
    [ccIrregularities, targetDateStr]
  );

  const todaysKeycardDiscrepancies = useMemo<KeycardDiscrepancy[]>(
    () =>
      keycardDiscrepancies.filter((d) =>
        sameItalyDate(d.timestamp, targetDateStr)
      ),
    [keycardDiscrepancies, targetDateStr]
  );

  const keycardDiscrepancyTotal = useMemo(
    () =>
      todaysKeycardDiscrepancies.reduce((sum, d) => sum + d.amount, 0),
    [todaysKeycardDiscrepancies]
  );

  const todaysDiscrepancies = useMemo<CashDiscrepancy[]>(
    () =>
      cashDiscrepancies.filter((d) => sameItalyDate(d.timestamp, targetDateStr)),
    [cashDiscrepancies, targetDateStr]
  );

  const discrepancySummary = useMemo(() => {
    const map: Record<string, number> = {};
    todaysDiscrepancies.forEach((d) => {
      map[d.user] = (map[d.user] || 0) + d.amount;
    });
    return map;
  }, [todaysDiscrepancies]);

  const keycardTransactions = useMemo(
    () =>
      transactions.filter(
        (t) => t.timestamp && sameItalyDate(t.timestamp, targetDateStr)
      ),
    [transactions, targetDateStr]
  );

  const keycardsLoaned = useMemo(
    () =>
      keycardTransactions
        .filter((t) => t.type === "Loan" && t.isKeycard)
        .reduce((sum, t) => sum + (t.count || 0), 0),
    [keycardTransactions]
  );

  const keycardsReturned = useMemo(
    () =>
      keycardTransactions
        .filter((t) => t.type === "Refund" && t.isKeycard)
        .reduce((sum, t) => sum + (t.count || 0), 0),
    [keycardTransactions]
  );

  const { openingCash, closingCash, floatTotal, tenderRemovalTotal } = useMemo(() => {
    const sameDayCounts = cashCounts
      .filter((c) => sameItalyDate(c.timestamp, targetDateStr))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    let opening: number | undefined;
    let closing: number | undefined;
    let float = 0;
    let tenderRemoval = 0;

    sameDayCounts.forEach((c) => {
      if (c.type === "opening" && typeof c.count === "number" && opening === undefined) {
        opening = c.count;
      }
      if (c.type === "close" && typeof c.count === "number") {
        closing = c.count;
      }
      const isFloatEntry = c.type === "float";
      if (isFloatEntry && typeof c.amount === "number") {
        float += c.amount;
      }
      if (c.type === "tenderRemoval" && typeof c.amount === "number") {
        tenderRemoval += c.amount;
      }
    });

    return {
      openingCash: opening ?? 0,
      closingCash: closing ?? 0,
      floatTotal: float,
      tenderRemovalTotal: tenderRemoval,
    };
  }, [cashCounts, targetDateStr]);

  const { openingKeycards, closingKeycards } = useMemo(() => {
    const sameDayCashCounts = cashCounts
      .filter((c) => sameItalyDate(c.timestamp, targetDateStr))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const sameDaySafeCounts = safeCounts
      .filter((c) => sameItalyDate(c.timestamp, targetDateStr))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    let openingTill: number | undefined;
    let closingTill: number | undefined;
    sameDayCashCounts.forEach((c) => {
      if (c.type === "opening" && c.keycardCount !== undefined && openingTill === undefined) {
        openingTill = c.keycardCount;
      }
      if (c.type === "close" && c.keycardCount !== undefined) {
        closingTill = c.keycardCount;
      }
    });

    const safeCountTypes = new Set<SafeCount["type"]>([
      "opening",
      "safeReset",
      "safeReconcile",
    ]);
    let openingSafe: number | undefined;
    let closingSafe: number | undefined;
    sameDaySafeCounts.forEach((c) => {
      if (safeCountTypes.has(c.type) && c.keycardCount !== undefined) {
        if (openingSafe === undefined) {
          openingSafe = c.keycardCount;
        }
        closingSafe = c.keycardCount;
      }
    });

    return {
      openingKeycards: (openingTill ?? 0) + (openingSafe ?? 0),
      closingKeycards: (closingTill ?? 0) + (closingSafe ?? 0),
    };
  }, [cashCounts, safeCounts, targetDateStr]);

  const beginningSafeBalance = useMemo(() => {
    const midnight = new Date(startOfDayIso(date)).getTime();
    const midnightBalance = getSafeBalanceAt(midnight);

    const sameDayEntry = safeCounts
      .filter((c) => sameItalyDate(c.timestamp, targetDateStr))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .find(
        (c) =>
          ["opening", "safeReset", "safeReconcile"].includes(c.type) &&
          typeof c.count === "number"
      );
    if (sameDayEntry && typeof sameDayEntry.count === "number") {
      return sameDayEntry.count;
    }

    const priorEntry = safeCounts
      .filter((c) => parseYMD(c.timestamp) < midnight)
      .sort((a, b) => parseYMD(b.timestamp) - parseYMD(a.timestamp))
      .find(
        (c) =>
          ["opening", "safeReset", "safeReconcile"].includes(c.type) &&
          typeof c.count === "number"
      );

    return priorEntry && typeof priorEntry.count === "number"
      ? priorEntry.count
      : midnightBalance;
  }, [date, getSafeBalanceAt, safeCounts, targetDateStr]);

  const endingSafeBalance = useMemo(
    () =>
      getSafeBalanceAt(new Date(endOfDayIso(date)).getTime()),
    [date, getSafeBalanceAt]
  );
  const {
    safeVariance,
    expectedSafeVariance,
    safeVarianceMismatch,
    safeInflowsMismatch,
  } = useMemo(
    () =>
      calculateSafeVariance({
        beginningSafeBalance,
        endingSafeBalance,
        safeInflowsTotal,
        safeOutflowsTotal,
        bankWithdrawalsTotal,
        tenderRemovalTotal,
        drawerToSafeExchangesTotal,
        safeToDrawerExchangesTotal,
        depositsTotal,
      }),
    [
      beginningSafeBalance,
      endingSafeBalance,
      safeInflowsTotal,
      safeOutflowsTotal,
      bankWithdrawalsTotal,
      tenderRemovalTotal,
      drawerToSafeExchangesTotal,
      safeToDrawerExchangesTotal,
      depositsTotal,
    ]
  );

  const { expectedCash, variance } = useMemo(
    () =>
      calculateCashVariance({
        openingCash,
        totalsCash: totals.cash,
        floatTotal,
        tenderRemovalTotal,
        closingCash,
        drawerToSafeExchangesTotal,
        safeToDrawerExchangesTotal,
      }),
    [
      openingCash,
      totals.cash,
      floatTotal,
      tenderRemovalTotal,
      closingCash,
      drawerToSafeExchangesTotal,
      safeToDrawerExchangesTotal,
    ]
  );

  const {
    expectedKeycards,
    keycardVariance,
    keycardVarianceMismatch,
  } = useMemo(
    () =>
      calculateKeycardVariance({
        openingKeycards,
        safeKeycardInflowsTotal: safeKeycardInflowsForVariance,
        safeKeycardOutflowsTotal: safeKeycardOutflowsForVariance,
        keycardsLoaned,
        keycardsReturned,
        keycardReconcileAdjustment,
        closingKeycards,
      }),
    [
      openingKeycards,
      safeKeycardInflowsForVariance,
      safeKeycardOutflowsForVariance,
      keycardsLoaned,
      keycardsReturned,
      keycardReconcileAdjustment,
      closingKeycards,
    ]
  );

  return {
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
    bankDrops: { rows: todaysBankDrops, total: bankDropsTotal },
    bankWithdrawals: { rows: todaysBankWithdrawals, total: bankWithdrawalsTotal },
    deposits: { rows: todaysDeposits, total: depositsTotal },
    withdrawals: { rows: todaysWithdrawals, total: withdrawalsTotal },
    pettyWithdrawals: { rows: todaysPettyWithdrawals, total: pettyWithdrawalsTotal },
    drawerToSafeExchanges: {
      rows: todaysDrawerToSafeExchanges,
      total: drawerToSafeExchangesTotal,
    },
    safeToDrawerExchanges: {
      rows: todaysSafeToDrawerExchanges,
      total: safeToDrawerExchangesTotal,
    },
    todaysSafeReconciles,
    todaysSafeResets,
    reconcilesTotal,
    safeInflowsTotal,
    safeOutflowsTotal,
    safeKeycardInflowsTotal,
    safeKeycardOutflowsTotal,
    keycardTransfersToSafe: {
      rows: todaysTransfersToSafe,
      total: keycardTransfersToSafeTotal,
    },
    keycardTransfersFromSafe: {
      rows: todaysTransfersFromSafe,
      total: keycardTransfersFromSafeTotal,
    },
    todaysCreditSlips,
    discrepancySummary,
    todaysKeycardDiscrepancies,
    keycardDiscrepancyTotal,
    openingCash,
    closingCash,
    floatTotal,
    tenderRemovalTotal,
    drawerToSafeExchangesTotal,
    safeToDrawerExchangesTotal,
    expectedCash,
    variance,
    openingKeycards,
    expectedKeycards,
    keycardReconcileAdjustment,
    closingKeycards,
    keycardVariance,
    keycardVarianceMismatch,
    beginningSafeBalance,
    endingSafeBalance,
    expectedSafeVariance,
    safeVariance,
    safeVarianceMismatch,
    safeInflowsMismatch,
  };
}

export default useEndOfDayReportData;
