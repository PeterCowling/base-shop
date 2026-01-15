import { describe, expect, it } from "vitest";
import {
  calculateCashVariance,
  calculateKeycardVariance,
  calculateSafeVariance,
} from "../variance";

describe("variance helpers", () => {
  it("computes cash variance", () => {
    const { expectedCash, variance } = calculateCashVariance({
      openingCash: 100,
      totalsCash: 50,
      floatTotal: 20,
      tenderRemovalTotal: 10,
      closingCash: 160,
    });
    expect(expectedCash).toBe(160);
    expect(variance).toBeCloseTo(0);
  });

  it("adjusts expected cash when more cash moves to the safe", () => {
    const { expectedCash, variance } = calculateCashVariance({
      openingCash: 100,
      totalsCash: 50,
      floatTotal: 0,
      tenderRemovalTotal: 10,
      closingCash: 130,
      drawerToSafeExchangesTotal: 20,
      safeToDrawerExchangesTotal: 10,
    });

    expect(expectedCash).toBe(130);
    expect(variance).toBeCloseTo(0);
  });

  it("computes keycard variance", () => {
    const { expectedKeycards, keycardVariance, keycardVarianceMismatch } =
      calculateKeycardVariance({
        openingKeycards: 10,
        safeKeycardInflowsTotal: 3,
        safeKeycardOutflowsTotal: 2,
        keycardsLoaned: 1,
        keycardsReturned: 4,
        keycardReconcileAdjustment: 0,
        closingKeycards: 14,
      });
    expect(expectedKeycards).toBe(14);
    expect(keycardVariance).toBeCloseTo(0);
    expect(keycardVarianceMismatch).toBe(false);
  });

  it("computes safe variance", () => {
    const { safeVariance, expectedSafeVariance, safeVarianceMismatch, safeInflowsMismatch } =
      calculateSafeVariance({
        beginningSafeBalance: 100,
        endingSafeBalance: 130,
        safeInflowsTotal: 25,
        safeOutflowsTotal: 10,
        bankWithdrawalsTotal: 15,
        tenderRemovalTotal: 25,
        drawerToSafeExchangesTotal: 15,
        safeToDrawerExchangesTotal: 0,
        depositsTotal: 10,
      });
    expect(safeVariance).toBe(30);
    expect(expectedSafeVariance).toBe(30);
    expect(safeVarianceMismatch).toBe(false);
    expect(safeInflowsMismatch).toBe(false);
  });
});
