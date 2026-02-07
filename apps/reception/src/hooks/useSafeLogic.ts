import { useCallback, useMemo } from "react";

import { parseYMD } from "../utils/dateUtils";

import { useSafeCountsData } from "./data/useSafeCountsData";
import { useSafeCountsMutations } from "./mutations/useSafeCountsMutations";

export interface UseSafeLogicParams {
  startAt?: string | number;
  endAt?: string | number;
}

export function useSafeLogic(params: UseSafeLogicParams = {}) {
  const { startAt, endAt } = params;
  const { safeCounts, loading, error } = useSafeCountsData({
    orderByChild: "timestamp",
    startAt,
    endAt,
  });
  const {
    addDeposit,
    addWithdrawal,
    addBankDeposit,
    addBankWithdrawal,
    addPettyWithdrawal,
    addExchange,
    addOpening,
    addReset,
    addReconcile,
  } = useSafeCountsMutations();

  const balanceTimeline = useMemo(() => {
    const withTs = safeCounts.map((s, index) => {
      const parsed = parseYMD(s.timestamp);
      return {
        entry: s,
        ts: Number.isNaN(parsed) ? index : parsed,
      };
    });

    withTs.sort((a, b) => a.ts - b.ts);

    let current = 0;
    const timeline: { timestamp: number; balance: number }[] = [];

    for (const { entry, ts } of withTs) {
      if (["opening", "safeReset", "safeReconcile"].includes(entry.type)) {
        current = entry.count || 0;
      } else {
        switch (entry.type) {
          case "deposit":
          case "bankWithdrawal":
            current += entry.amount || 0;
            break;
          case "withdrawal":
          case "pettyWithdrawal":
          case "bankDeposit":
            current -= entry.amount || 0;
            break;
          default:
            break;
        }
      }

      timeline.push({ timestamp: ts, balance: current });
    }

    return timeline;
  }, [safeCounts]);

  const getSafeBalanceAt = useCallback(
    (timestamp: number) => {
      let left = 0;
      let right = balanceTimeline.length - 1;
      let ans = 0;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const entry = balanceTimeline[mid];

        if (entry.timestamp <= timestamp) {
          ans = entry.balance;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      return ans;
    },
    [balanceTimeline]
  );

  const safeBalance = useMemo(
    () => getSafeBalanceAt(Date.now()),
    [getSafeBalanceAt]
  );

  const recordDeposit = useCallback(
    (
      amount: number,
      keycardCount: number,
      keycardDifference: number,
      denomBreakdown?: Record<string, number>
    ) => {
      if (amount <= 0) {
        throw new Error("Amount must be greater than zero");
      }
      return addDeposit(amount, keycardCount, keycardDifference, denomBreakdown);
    },
    [addDeposit]
  );

  const recordWithdrawal = useCallback(
    async (
      amount: number,
      denomBreakdown?: Record<string, number>,
      skipBalanceCheck = false
    ): Promise<void> => {
      if (amount <= 0) {
        throw new Error("Amount must be greater than zero");
      }
      if (!skipBalanceCheck && amount > safeBalance) {
        throw new Error("Insufficient funds in safe");
      }
      await addWithdrawal(amount, denomBreakdown);
    },
    [addWithdrawal, safeBalance]
  );

  const recordBankDeposit = useCallback(
    (
      amount: number,
      keycardCount: number,
      keycardDifference: number,
      denomBreakdown?: Record<string, number>
    ) => {
      if (amount <= 0) {
        throw new Error("Amount must be greater than zero");
      }
      return addBankDeposit(amount, keycardCount, keycardDifference, denomBreakdown);
    },
    [addBankDeposit]
  );

  const recordBankWithdrawal = useCallback(
    (
      amount: number,
      denomBreakdown?: Record<string, number>
    ) => {
      if (amount <= 0) {
        throw new Error("Amount must be greater than zero");
      }
      return addBankWithdrawal(amount, denomBreakdown);
    },
    [addBankWithdrawal]
  );

  const recordPettyWithdrawal = useCallback(
    (amount: number) => {
      if (amount <= 0) {
        throw new Error("Amount must be greater than zero");
      }
      return addPettyWithdrawal(amount);
    },
    [addPettyWithdrawal]
  );

  const recordExchange = useCallback(
    (
      outgoing: Record<string, number>,
      incoming: Record<string, number>,
      direction: "drawerToSafe" | "safeToDrawer",
      total: number
    ) => {
      if (total <= 0) {
        throw new Error("Amount must be greater than zero");
      }
      return addExchange(outgoing, incoming, direction, total);
    },
    [addExchange]
  );

  const recordOpening = useCallback(
    (count: number, keycardCount: number) => addOpening(count, keycardCount),
    [addOpening]
  );

  const recordReset = useCallback(
    (
      count: number,
      keycardCount: number,
      keycardDifference: number,
      breakdown: Record<string, number>
    ) => addReset(count, keycardCount, keycardDifference, breakdown),
    [addReset]
  );

  const recordReconcile = useCallback(
    (
      count: number,
      difference: number,
      keycardCount: number,
      keycardDifference: number,
      denomBreakdown: Record<string, number>
    ) =>
      addReconcile(
        count,
        difference,
        keycardCount,
        keycardDifference,
        denomBreakdown
      ),
    [addReconcile]
  );

  return {
    safeCounts,
    safeBalance,
    getSafeBalanceAt,
    loading,
    error,
    recordDeposit,
    recordWithdrawal,
    recordBankDeposit,
    recordBankWithdrawal,
    recordPettyWithdrawal,
    recordExchange,
    recordOpening,
    recordReset,
    recordReconcile,
  };
}
