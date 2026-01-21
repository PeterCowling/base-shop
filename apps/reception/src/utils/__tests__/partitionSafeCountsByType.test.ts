
import "@testing-library/jest-dom";
import type { SafeCount } from "../../types/hooks/data/safeCountData";
import { partitionSafeCountsByType } from "../partitionSafeCountsByType";

describe("partitionSafeCountsByType", () => {
  const dateStr = "2024-05-20";
  const counts: SafeCount[] = [
    { id: "1", user: "a", timestamp: `${dateStr}T10:00:00Z`, type: "bankDeposit" },
    { id: "2", user: "b", timestamp: `${dateStr}T11:00:00Z`, type: "deposit" },
    { id: "3", user: "c", timestamp: `${dateStr}T12:00:00Z`, type: "pettyWithdrawal" },
    { id: "4", user: "d", timestamp: `${dateStr}T13:00:00Z`, type: "safeReconcile" },
    { id: "5", user: "e", timestamp: `${dateStr}T14:00:00Z`, type: "withdrawal" },
    { id: "6", user: "f", timestamp: `${dateStr}T15:00:00Z`, type: "bankWithdrawal" },
    // Different date and type should be ignored
    { id: "7", user: "g", timestamp: "2024-05-19T09:00:00Z", type: "deposit" },
    {
      id: "8",
      user: "h",
      timestamp: `${dateStr}T16:00:00Z`,
      type: "exchange",
      amount: 5,
      direction: "drawerToSafe",
    },
    {
      id: "9",
      user: "i",
      timestamp: `${dateStr}T17:00:00Z`,
      type: "exchange",
      amount: 7,
      direction: "safeToDrawer",
    },
  ];

  const result = partitionSafeCountsByType(counts, dateStr);

  it("partitions bank drops", () => {
    expect(result.bankDrops).toHaveLength(1);
    expect(result.bankDrops[0].type).toBe("bankDeposit");
  });

  it("partitions deposits", () => {
    expect(result.deposits).toHaveLength(1);
    expect(result.deposits[0].type).toBe("deposit");
  });

  it("partitions petty withdrawals", () => {
    expect(result.pettyWithdrawals).toHaveLength(1);
    expect(result.pettyWithdrawals[0].type).toBe("pettyWithdrawal");
  });

  it("partitions withdrawals", () => {
    expect(result.withdrawals).toHaveLength(1);
    expect(result.withdrawals[0].type).toBe("withdrawal");
  });

  it("partitions bank withdrawals", () => {
    expect(result.bankWithdrawals).toHaveLength(1);
    expect(result.bankWithdrawals[0].type).toBe("bankWithdrawal");
  });

  it("partitions safe reconciles", () => {
    expect(result.safeReconciles).toHaveLength(1);
    expect(result.safeReconciles[0].type).toBe("safeReconcile");
  });

  it("partitions exchanges by direction", () => {
    expect(result.drawerToSafeExchanges).toHaveLength(1);
    expect(result.drawerToSafeExchanges[0].direction).toBe("drawerToSafe");
    expect(result.safeToDrawerExchanges).toHaveLength(1);
    expect(result.safeToDrawerExchanges[0].direction).toBe("safeToDrawer");
  });

  it("ignores exchanges with unrecognized direction", () => {
    const invalid: SafeCount[] = [
      {
        id: "1",
        user: "x",
        timestamp: `${dateStr}T18:00:00Z`,
        type: "exchange",
        amount: 5,
        // @ts-expect-error testing invalid direction
        direction: "invalidDirection",
      },
    ];

    const partitioned = partitionSafeCountsByType(invalid, dateStr);
    expect(partitioned.drawerToSafeExchanges).toHaveLength(0);
    expect(partitioned.safeToDrawerExchanges).toHaveLength(0);
  });

  it("sorts each partition chronologically", () => {
    const unsorted: SafeCount[] = [
      { id: "1", user: "u1", timestamp: `${dateStr}T12:00:00Z`, type: "deposit" },
      { id: "2", user: "u2", timestamp: `${dateStr}T10:00:00Z`, type: "deposit" },
      { id: "3", user: "u3", timestamp: `${dateStr}T11:00:00Z`, type: "bankDeposit" },
      { id: "4", user: "u4", timestamp: `${dateStr}T09:00:00Z`, type: "bankDeposit" },
      { id: "5", user: "u5", timestamp: `${dateStr}T14:00:00Z`, type: "pettyWithdrawal" },
      { id: "6", user: "u6", timestamp: `${dateStr}T13:00:00Z`, type: "pettyWithdrawal" },
      { id: "7", user: "u7", timestamp: `${dateStr}T16:00:00Z`, type: "withdrawal" },
      { id: "8", user: "u8", timestamp: `${dateStr}T15:00:00Z`, type: "withdrawal" },
      { id: "9", user: "u9", timestamp: `${dateStr}T18:00:00Z`, type: "bankWithdrawal" },
      { id: "10", user: "u10", timestamp: `${dateStr}T17:00:00Z`, type: "bankWithdrawal" },
      {
        id: "11",
        user: "u11",
        timestamp: `${dateStr}T19:00:00Z`,
        type: "exchange",
        amount: 5,
        direction: "safeToDrawer",
      },
      {
        id: "12",
        user: "u12",
        timestamp: `${dateStr}T20:00:00Z`,
        type: "exchange",
        amount: 5,
        direction: "drawerToSafe",
      },
    ];

    const ordered = partitionSafeCountsByType(unsorted, dateStr);

    expect(ordered.deposits.map((c) => c.timestamp)).toEqual([
      `${dateStr}T10:00:00Z`,
      `${dateStr}T12:00:00Z`,
    ]);
    expect(ordered.bankDrops.map((c) => c.timestamp)).toEqual([
      `${dateStr}T09:00:00Z`,
      `${dateStr}T11:00:00Z`,
    ]);
    expect(ordered.pettyWithdrawals.map((c) => c.timestamp)).toEqual([
      `${dateStr}T13:00:00Z`,
      `${dateStr}T14:00:00Z`,
    ]);
    expect(ordered.withdrawals.map((c) => c.timestamp)).toEqual([
      `${dateStr}T15:00:00Z`,
      `${dateStr}T16:00:00Z`,
    ]);
    expect(ordered.bankWithdrawals.map((c) => c.timestamp)).toEqual([
      `${dateStr}T17:00:00Z`,
      `${dateStr}T18:00:00Z`,
    ]);
    expect(
      ordered.safeToDrawerExchanges.map((c) => c.timestamp)
    ).toEqual([`${dateStr}T19:00:00Z`]);
    expect(
      ordered.drawerToSafeExchanges.map((c) => c.timestamp)
    ).toEqual([`${dateStr}T20:00:00Z`]);
  });

  it("assigns records to the correct day around midnight", () => {
    const nearMidnight: SafeCount[] = [
      // 23:59 local time in Italy
      { id: "1", user: "before", timestamp: "2024-05-20T21:59:00Z", type: "deposit" },
      // 00:01 local time in Italy (next day)
      { id: "2", user: "after", timestamp: "2024-05-20T22:01:00Z", type: "deposit" },
    ];

    const day20 = partitionSafeCountsByType(nearMidnight, "2024-05-20");
    const day21 = partitionSafeCountsByType(nearMidnight, "2024-05-21");

    expect(day20.deposits.map((c) => c.user)).toEqual(["before"]);
    expect(day21.deposits.map((c) => c.user)).toEqual(["after"]);
  });
});
