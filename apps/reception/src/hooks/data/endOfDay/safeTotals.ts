import type { SafeCount } from "../../../types/hooks/data/safeCountData";

interface SafeTotalsInput {
  bankDrops: SafeCount[];
  bankWithdrawals: SafeCount[];
  deposits: SafeCount[];
  withdrawals: SafeCount[];
  pettyWithdrawals: SafeCount[];
  safeReconciles: SafeCount[];
  drawerToSafeExchanges: SafeCount[];
  safeToDrawerExchanges: SafeCount[];
}

export function calculateSafeTotals({
  bankDrops,
  bankWithdrawals,
  deposits,
  withdrawals,
  pettyWithdrawals,
  safeReconciles,
  drawerToSafeExchanges,
  safeToDrawerExchanges,
}: SafeTotalsInput) {
  const sum = (arr: SafeCount[], fn: (c: SafeCount) => number | undefined) =>
    arr.reduce((s, c) => s + (fn(c) ?? 0), 0);
  const sumKeycards = (arr: SafeCount[]) =>
    arr.reduce((s, c) => s + (c.keycardDifference ?? 0), 0);
  const bankDropsTotal = sum(bankDrops, (c) => c.amount);
  const bankWithdrawalsTotal = sum(bankWithdrawals, (c) => c.amount);
  const depositsTotal = sum(deposits, (c) => c.amount);
  const withdrawalsTotal = sum(withdrawals, (c) => c.amount);
  const pettyWithdrawalsTotal = sum(pettyWithdrawals, (c) => c.amount);
  const reconcilesTotal = sum(safeReconciles, (c) => c.difference);
  const drawerToSafeExchangesTotal = sum(drawerToSafeExchanges, (c) => c.amount);
  const safeToDrawerExchangesTotal = sum(safeToDrawerExchanges, (c) => c.amount);

  // Exchanges are internal transfers and should not affect net inflow/outflow totals.
  // We track them separately so that they can be reconciled independently.
  const safeInflowsTotal = depositsTotal + bankWithdrawalsTotal;
  const safeOutflowsTotal =
    withdrawalsTotal + bankDropsTotal + pettyWithdrawalsTotal;

  const depositsKeycards = sumKeycards(deposits);
  const withdrawalsKeycards = sumKeycards(withdrawals);
  const bankDropsKeycards = sumKeycards(bankDrops);
  const bankWithdrawalsKeycards = sumKeycards(bankWithdrawals);
  const pettyWithdrawalsKeycards = sumKeycards(pettyWithdrawals);
  const drawerToSafeExchangesKeycards = sumKeycards(drawerToSafeExchanges);
  const safeToDrawerExchangesKeycards = sumKeycards(safeToDrawerExchanges);

  const safeKeycardInflowsTotal =
    depositsKeycards +
    bankWithdrawalsKeycards +
    drawerToSafeExchangesKeycards;
  const safeKeycardOutflowsTotal =
    withdrawalsKeycards +
    bankDropsKeycards +
    pettyWithdrawalsKeycards +
    safeToDrawerExchangesKeycards;

  return {
    bankDropsTotal,
    bankWithdrawalsTotal,
    depositsTotal,
    withdrawalsTotal,
    pettyWithdrawalsTotal,
    reconcilesTotal,
    drawerToSafeExchangesTotal,
    safeToDrawerExchangesTotal,
    bankDropsKeycards,
    bankWithdrawalsKeycards,
    depositsKeycards,
    withdrawalsKeycards,
    pettyWithdrawalsKeycards,
    drawerToSafeExchangesKeycards,
    safeToDrawerExchangesKeycards,
    safeInflowsTotal,
    safeOutflowsTotal,
    safeKeycardInflowsTotal,
    safeKeycardOutflowsTotal,
  };
}

export default calculateSafeTotals;
