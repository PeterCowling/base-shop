import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useFinancialsRoomMutations from "../useFinancialsRoomMutations";

/* eslint-disable no-var */
var database: unknown;
var refMock: ReturnType<typeof vi.fn>;
var getMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

vi.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  get: (...args: unknown[]) => getMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

function snap<T>(val: T) {
  return {
    exists: () => val !== null && val !== undefined,
    val: () => val,
  } as const;
}

beforeEach(() => {
  database = {};
  refMock = vi.fn((_db: unknown, path?: string) => path ?? "");
  getMock = vi.fn();
  setMock = vi.fn();
});

describe("useFinancialsRoomMutations", () => {
  it("merges data and recalculates totals", async () => {
    const existing = {
      balance: 0,
      totalDue: 0,
      totalPaid: 0,
      totalAdjust: 0,
      transactions: {
        t1: { type: "charge", amount: 50, timestamp: "", nonRefundable: false },
      },
    };
    getMock.mockResolvedValue(snap(existing));

    const { result } = renderHook(() => useFinancialsRoomMutations());

    await act(async () => {
      await result.current.saveFinancialsRoom("BR1", {
        transactions: {
          t2: { type: "payment", amount: 20, timestamp: "", nonRefundable: false },
        },
      });
    });

    expect(refMock).toHaveBeenCalledWith(database, "financialsRoom/BR1");
    expect(setMock).toHaveBeenCalledWith("financialsRoom/BR1", {
      balance: 30,
      totalDue: 50,
      totalPaid: 20,
      totalAdjust: 0,
      transactions: {
        t1: { type: "charge", amount: 50, timestamp: "", nonRefundable: false },
        t2: { type: "payment", amount: 20, timestamp: "", nonRefundable: false },
      },
    });
    expect(result.current.error).toBeNull();
  });

  it("rejects when database missing", async () => {
    database = null;
    const { result } = renderHook(() => useFinancialsRoomMutations());
    await act(async () => {
      await expect(
        result.current.saveFinancialsRoom("BR1", {})
      ).rejects.toThrow("Firebase database is not initialized.");
    });
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("sets error when set fails", async () => {
    getMock.mockResolvedValue(snap({
      balance: 0,
      totalDue: 0,
      totalPaid: 0,
      totalAdjust: 0,
      transactions: {},
    }));
    setMock.mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useFinancialsRoomMutations());

    await act(async () => {
      await expect(
        result.current.saveFinancialsRoom("BR1", {})
      ).rejects.toThrow("fail");
    });
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

