import "@testing-library/jest-dom";
import type { SafeCount } from "../../../../types/hooks/data/safeCountData";
import { calculateSafeTotals } from "../safeTotals";

describe("calculateSafeTotals", () => {
  it("computes cash and keycard totals", () => {
    const baseTime = "2024-01-01T10:00:00Z";
    const bankDrops: SafeCount[] = [
      {
        id: "1",
        user: "u",
        timestamp: baseTime,
        type: "bankDeposit",
        amount: 30,
        keycardCount: 100,
        keycardDifference: 1,
      },
    ];
    const bankWithdrawals: SafeCount[] = [
      {
        id: "2",
        user: "u",
        timestamp: baseTime,
        type: "bankWithdrawal",
        amount: 20,
        keycardCount: 200,
        keycardDifference: 2,
      },
    ];
    const deposits: SafeCount[] = [
      {
        id: "3",
        user: "u",
        timestamp: baseTime,
        type: "deposit",
        amount: 50,
        keycardCount: 300,
        keycardDifference: 3,
      },
    ];
    const withdrawals: SafeCount[] = [
      {
        id: "4",
        user: "u",
        timestamp: baseTime,
        type: "withdrawal",
        amount: 40,
        keycardCount: 400,
        keycardDifference: 4,
      },
    ];
    const pettyWithdrawals: SafeCount[] = [
      { id: "5", user: "u", timestamp: baseTime, type: "pettyWithdrawal", amount: 10 },
    ];
    const safeReconciles: SafeCount[] = [
      { id: "6", user: "u", timestamp: baseTime, type: "safeReconcile", difference: 5 },
    ];
    const drawerToSafeExchanges: SafeCount[] = [
      {
        id: "7",
        user: "u",
        timestamp: baseTime,
        type: "exchange",
        direction: "drawerToSafe",
        amount: 60,
        keycardCount: 500,
        keycardDifference: 5,
      },
    ];
    const safeToDrawerExchanges: SafeCount[] = [
      {
        id: "8",
        user: "u",
        timestamp: baseTime,
        type: "exchange",
        direction: "safeToDrawer",
        amount: 20,
        keycardCount: 600,
        keycardDifference: 6,
      },
    ];

    const totals = calculateSafeTotals({
      bankDrops,
      bankWithdrawals,
      deposits,
      withdrawals,
      pettyWithdrawals,
      safeReconciles,
      drawerToSafeExchanges,
      safeToDrawerExchanges,
    });

    expect(totals.bankDropsTotal).toBe(30);
    expect(totals.drawerToSafeExchangesTotal).toBe(60);
    expect(totals.reconcilesTotal).toBe(5);
    // Exchanges should not affect inflow/outflow totals
    expect(totals.safeInflowsTotal).toBe(70);
    expect(totals.safeOutflowsTotal).toBe(80);
    expect(totals.bankDropsKeycards).toBe(1);
    expect(totals.bankWithdrawalsKeycards).toBe(2);
    expect(totals.depositsKeycards).toBe(3);
    expect(totals.withdrawalsKeycards).toBe(4);
    expect(totals.pettyWithdrawalsKeycards).toBe(0);
    expect(totals.drawerToSafeExchangesKeycards).toBe(5);
    expect(totals.safeToDrawerExchangesKeycards).toBe(6);
    expect(totals.safeKeycardInflowsTotal).toBe(10);
    expect(totals.safeKeycardOutflowsTotal).toBe(11);
  });

  it("ignores exchanges when summing inflows and outflows", () => {
    const baseTime = "2024-01-01T10:00:00Z";
    const totals = calculateSafeTotals({
      bankDrops: [],
      bankWithdrawals: [],
      deposits: [],
      withdrawals: [],
      pettyWithdrawals: [],
      safeReconciles: [],
      drawerToSafeExchanges: [
        {
          id: "1",
          user: "u",
          timestamp: baseTime,
          type: "exchange",
          direction: "drawerToSafe",
          amount: 50,
        },
      ],
      safeToDrawerExchanges: [
        {
          id: "2",
          user: "u",
          timestamp: baseTime,
          type: "exchange",
          direction: "safeToDrawer",
          amount: 50,
        },
      ],
    });

    expect(totals.safeInflowsTotal).toBe(0);
    expect(totals.safeOutflowsTotal).toBe(0);
    expect(totals.drawerToSafeExchangesTotal).toBe(50);
    expect(totals.safeToDrawerExchangesTotal).toBe(50);
  });
});
