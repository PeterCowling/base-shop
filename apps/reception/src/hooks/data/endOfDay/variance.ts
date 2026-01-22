export interface CashVarianceInput {
  openingCash: number;
  totalsCash: number;
  floatTotal: number;
  tenderRemovalTotal: number;
  closingCash: number;
  drawerToSafeExchangesTotal?: number;
  safeToDrawerExchangesTotal?: number;
}

export function calculateCashVariance({
  openingCash,
  totalsCash,
  floatTotal,
  tenderRemovalTotal,
  closingCash,
  drawerToSafeExchangesTotal = 0,
  safeToDrawerExchangesTotal = 0,
}: CashVarianceInput) {
  const netDrawerToSafe = Math.max(
    0,
    drawerToSafeExchangesTotal - safeToDrawerExchangesTotal
  );
  const expectedCash =
    openingCash +
    totalsCash +
    floatTotal -
    tenderRemovalTotal -
    netDrawerToSafe;
  const variance = closingCash - expectedCash;
  return { expectedCash, variance };
}

export interface KeycardVarianceInput {
  openingKeycards: number;
  safeKeycardInflowsTotal: number;
  safeKeycardOutflowsTotal: number;
  keycardsLoaned: number;
  keycardsReturned: number;
  keycardReconcileAdjustment: number;
  closingKeycards: number;
}

export function calculateKeycardVariance({
  openingKeycards,
  safeKeycardInflowsTotal,
  safeKeycardOutflowsTotal,
  keycardsLoaned,
  keycardsReturned,
  keycardReconcileAdjustment,
  closingKeycards,
}: KeycardVarianceInput) {
  const expectedKeycards =
    openingKeycards +
    safeKeycardInflowsTotal -
    safeKeycardOutflowsTotal -
    keycardsLoaned +
    keycardsReturned +
    keycardReconcileAdjustment;
  const keycardVariance = closingKeycards - expectedKeycards;
  const keycardVarianceMismatch = Math.abs(keycardVariance) > 0.009;
  return { expectedKeycards, keycardVariance, keycardVarianceMismatch };
}

export interface SafeVarianceInput {
  beginningSafeBalance: number;
  endingSafeBalance: number;
  safeInflowsTotal: number;
  safeOutflowsTotal: number;
  bankWithdrawalsTotal: number;
  tenderRemovalTotal: number;
  drawerToSafeExchangesTotal: number;
  safeToDrawerExchangesTotal: number;
  depositsTotal: number;
}

export function calculateSafeVariance({
  beginningSafeBalance,
  endingSafeBalance,
  safeInflowsTotal,
  safeOutflowsTotal,
  tenderRemovalTotal,
  drawerToSafeExchangesTotal,
  safeToDrawerExchangesTotal,
  depositsTotal,
}: SafeVarianceInput) {
  const safeVariance = endingSafeBalance - beginningSafeBalance;
  const expectedSafeVariance =
    safeInflowsTotal -
    safeOutflowsTotal +
    drawerToSafeExchangesTotal -
    safeToDrawerExchangesTotal;
  const safeVarianceMismatch =
    Math.abs(expectedSafeVariance - safeVariance) > 0.009;
  // Tender removals should match net inflows from the drawer.
  const drawerInflows =
    depositsTotal + drawerToSafeExchangesTotal - safeToDrawerExchangesTotal;
  const safeInflowsMismatch =
    Math.abs(drawerInflows - tenderRemovalTotal) > 0.009;
  return {
    safeVariance,
    expectedSafeVariance,
    safeVarianceMismatch,
    safeInflowsMismatch,
  };
}
