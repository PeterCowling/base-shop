import { act, renderHook } from "@testing-library/react";

import type { LoanTransaction } from "../../../types/hooks/data/loansData";
import useLoansMutations from "../useLoansMutations";

/* eslint-disable no-var */
var useFirebaseDatabaseMock: jest.Mock;
var refMock: jest.Mock;
var getMock: jest.Mock;
var updateMock: jest.Mock;
var removeMock: jest.Mock;
var useOnlineStatusMock: jest.Mock;
var queueOfflineWriteMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => useFirebaseDatabaseMock(),
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "Tester" } }),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  get: (...args: unknown[]) => getMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
  remove: (...args: unknown[]) => removeMock(...args),
}));

jest.mock("../../../lib/offline/useOnlineStatus", () => ({
  useOnlineStatus: () => useOnlineStatusMock(),
}));

jest.mock("../../../lib/offline/syncManager", () => ({
  queueOfflineWrite: (...args: unknown[]) => queueOfflineWriteMock(...args),
}));

let logActivityMock: jest.Mock;
let addToAllTransactionsMock: jest.Mock;

jest.mock("../useActivitiesMutations", () => ({
  __esModule: true,
  default: () => ({
    logActivity: logActivityMock,
    addActivity: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

jest.mock("../useAllTransactionsMutations", () => ({
  __esModule: true,
  default: () => ({
    addToAllTransactions: addToAllTransactionsMock,
  }),
}));

jest.mock("../../../utils/generateTransactionId", () => ({
  generateTransactionId: () => "txn-test-id",
}));

const baseLoanData: LoanTransaction = {
  item: "Keycard",
  type: "Loan",
  deposit: 10,
  count: 1,
  depositType: "CASH",
  createdAt: "2024-01-01T10:00:00Z",
};

beforeEach(() => {
  useFirebaseDatabaseMock = jest.fn().mockReturnValue({});
  refMock = jest.fn((_db: unknown, path?: string) => ({ path: path ?? "" }));
  getMock = jest.fn();
  updateMock = jest.fn().mockResolvedValue(undefined);
  removeMock = jest.fn().mockResolvedValue(undefined);
  useOnlineStatusMock = jest.fn().mockReturnValue(true);
  queueOfflineWriteMock = jest.fn().mockResolvedValue(1);
  logActivityMock = jest.fn().mockResolvedValue(undefined);
  addToAllTransactionsMock = jest.fn().mockResolvedValue(undefined);
});

describe("useLoansMutations", () => {
  describe("saveLoan", () => {
    it("calls Firebase update when online", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.saveLoan("BR1", "occ1", "txn1", baseLoanData);
      });

      expect(updateMock).toHaveBeenCalled();
      expect(queueOfflineWriteMock).not.toHaveBeenCalled();
    });

    it("queues write when offline and IDB is available", async () => {
      useOnlineStatusMock.mockReturnValue(false);
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.saveLoan("BR1", "occ1", "txn1", baseLoanData);
      });

      expect(queueOfflineWriteMock).toHaveBeenCalledWith(
        "loans/BR1/occ1/txns/txn1",
        "update",
        baseLoanData,
        expect.objectContaining({ conflictPolicy: "last-write-wins", domain: "loans" })
      );
      expect(updateMock).not.toHaveBeenCalled();
    });
  });

  describe("removeOccupantIfEmpty", () => {
    it("fast path: isEmpty=true — calls update with null-write; no get", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeOccupantIfEmpty("BR1", "occ1", true);
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(removeMock).not.toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledTimes(1);
      const [, pathMap] = updateMock.mock.calls[0] as [unknown, Record<string, null>];
      expect(pathMap).toEqual({ "loans/BR1/occ1": null });
    });

    it("fast path: isEmpty=false — no Firebase calls at all; returns null", async () => {
      const { result } = renderHook(() => useLoansMutations());

      let returnVal: unknown;
      await act(async () => {
        returnVal = await result.current.removeOccupantIfEmpty("BR1", "occ1", false);
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(removeMock).not.toHaveBeenCalled();
      expect(updateMock).not.toHaveBeenCalled();
      expect(returnVal).toBeNull();
    });

    it("fallback: no param, occupant has txns — get called; remove NOT called", async () => {
      getMock.mockResolvedValueOnce({
        exists: () => true,
        size: 1,
      });

      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeOccupantIfEmpty("BR1", "occ1");
      });

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(removeMock).not.toHaveBeenCalled();
    });

    it("fallback: no param, occupant empty — get called; remove called", async () => {
      getMock.mockResolvedValueOnce({
        exists: () => false,
        size: 0,
      });

      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeOccupantIfEmpty("BR1", "occ1");
      });

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(removeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeLoanItem", () => {
    it("fast path (non-Keycard): deposit provided — no get; update called with txn null-write; logActivity not called", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeLoanItem("BR1", "occ1", "txn1", "Umbrella", 0, false);
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(removeMock).not.toHaveBeenCalled();
      expect(logActivityMock).not.toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledTimes(1);
      const [, pathMap] = updateMock.mock.calls[0] as [unknown, Record<string, null>];
      expect(pathMap).toEqual({ "loans/BR1/occ1/txns/txn1": null });
    });

    it("fast path (non-Keycard): isEmpty=true — update includes occupant null-write", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeLoanItem("BR1", "occ1", "txn1", "Umbrella", 0, true);
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledTimes(1);
      const [, pathMap] = updateMock.mock.calls[0] as [unknown, Record<string, null>];
      expect(pathMap).toEqual({
        "loans/BR1/occ1/txns/txn1": null,
        "loans/BR1/occ1": null,
      });
    });

    it("fast path (Keycard, deposit>0): logActivity called; addToAllTransactions called with refund; update called", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeLoanItem("BR1", "occ1", "txn1", "Keycard", 10, false);
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(logActivityMock).toHaveBeenCalledWith("occ1", 13);
      expect(addToAllTransactionsMock).toHaveBeenCalledWith(
        "txn-test-id",
        expect.objectContaining({
          amount: -10,
          description: "Keycard deposit refund",
          isKeycard: true,
          itemCategory: "KeycardDepositRefund",
        })
      );
    });

    it("fast path (Keycard, deposit=0): logActivity called; addToAllTransactions NOT called", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeLoanItem("BR1", "occ1", "txn1", "Keycard", 0, false);
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(logActivityMock).toHaveBeenCalledWith("occ1", 13);
      expect(addToAllTransactionsMock).not.toHaveBeenCalled();
    });

    it("fallback: no deposit param — get called once; remove called for txn", async () => {
      getMock.mockResolvedValueOnce({
        exists: () => true,
        val: () => ({ ...baseLoanData, deposit: 5 }),
      });
      // Second get for removeOccupantIfEmpty fallback (has txns remaining)
      getMock.mockResolvedValueOnce({ exists: () => true, size: 1 });

      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeLoanItem("BR1", "occ1", "txn1", "Padlock");
      });

      expect(getMock).toHaveBeenCalledTimes(2);
      expect(removeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeLoanTransactionsForItem", () => {
    function makeSnapshot(
      rows: Array<{ key: string; value: LoanTransaction }>
    ): {
      exists: () => boolean;
      forEach: (cb: (snap: { key: string; val: () => LoanTransaction }) => void) => void;
      size: number;
    } {
      return {
        exists: () => rows.length > 0,
        forEach: (cb) => {
          rows.forEach((row) => {
            cb({
              key: row.key,
              val: () => row.value,
            });
          });
        },
        size: rows.length,
      };
    }

    it("fast path: matchingTxnIds + isOccupantEmpty=true — single update with all null-writes; no get or remove", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeLoanTransactionsForItem(
          "BR1",
          "occ1",
          "Keycard",
          ["t-1", "t-2"],
          true
        );
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(removeMock).not.toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledTimes(1);
      const [, pathMap] = updateMock.mock.calls[0] as [unknown, Record<string, null>];
      expect(pathMap).toEqual({
        "loans/BR1/occ1/txns/t-1": null,
        "loans/BR1/occ1/txns/t-2": null,
        "loans/BR1/occ1": null,
      });
    });

    it("fast path: matchingTxnIds + isOccupantEmpty=false — update txn null-writes only; occupant NOT included", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeLoanTransactionsForItem(
          "BR1",
          "occ1",
          "Keycard",
          ["t-1"],
          false
        );
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(removeMock).not.toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledTimes(1);
      const [, pathMap] = updateMock.mock.calls[0] as [unknown, Record<string, null>];
      expect(pathMap).toEqual({
        "loans/BR1/occ1/txns/t-1": null,
      });
      expect(pathMap["loans/BR1/occ1"]).toBeUndefined();
    });

    it("fast path: empty matchingTxnIds — returns null with no Firebase calls", async () => {
      const { result } = renderHook(() => useLoansMutations());

      let returnVal: unknown;
      await act(async () => {
        returnVal = await result.current.removeLoanTransactionsForItem(
          "BR1",
          "occ1",
          "Keycard",
          [],
          true
        );
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(updateMock).not.toHaveBeenCalled();
      expect(removeMock).not.toHaveBeenCalled();
      expect(returnVal).toBeNull();
    });

    it("fallback: no matchingTxnIds — get called; remove called for each match; then removeOccupantIfEmpty fallback runs", async () => {
      getMock
        .mockResolvedValueOnce(
          makeSnapshot([
            {
              key: "t-1",
              value: {
                item: "Keycard",
                type: "Loan",
                deposit: 10,
                count: 1,
                depositType: "CASH",
                createdAt: "2024-01-01T10:00:00Z",
              },
            },
            {
              key: "t-2",
              value: {
                item: "Keycard",
                type: "Loan",
                deposit: 10,
                count: 1,
                depositType: "CASH",
                createdAt: "2024-01-01T10:00:00Z",
              },
            },
            {
              key: "t-3",
              value: {
                item: "Padlock",
                type: "Loan",
                deposit: 10,
                count: 1,
                depositType: "CASH",
                createdAt: "2024-01-01T10:00:00Z",
              },
            },
          ])
        )
        // Second get for removeOccupantIfEmpty fallback
        .mockResolvedValueOnce({
          exists: () => false,
          size: 0,
        });

      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeLoanTransactionsForItem("BR1", "occ1", "Keycard");
      });

      // First get for txns snapshot; second for occupant emptiness check
      expect(getMock).toHaveBeenCalledTimes(2);
      // Removes: t-1, t-2 matched; then occupant removed because empty
      expect(removeMock).toHaveBeenCalledTimes(3);
    });

    it("propagates remove failure and skips cleanup check", async () => {
      getMock.mockResolvedValueOnce(
        makeSnapshot([
          {
            key: "t-1",
            value: {
              item: "Keycard",
              type: "Loan",
              deposit: 10,
              count: 1,
              depositType: "CASH",
              createdAt: "2024-01-01T10:00:00Z",
            },
          },
        ])
      );
      removeMock.mockRejectedValueOnce(new Error("remove failed"));

      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await expect(
          result.current.removeLoanTransactionsForItem("BR1", "occ1", "Keycard")
        ).rejects.toThrow("remove failed");
      });

      // only the initial txns read; removeOccupantIfEmpty read should not run
      expect(getMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("online-only operations", () => {
    beforeEach(() => {
      useOnlineStatusMock.mockReturnValue(false);
    });

    it("sets error and skips Firebase for removeOccupantIfEmpty when offline", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeOccupantIfEmpty("BR1", "occ1");
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(getMock).not.toHaveBeenCalled();
    });

    it("sets error and skips Firebase for removeLoanItem when offline", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.removeLoanItem("BR1", "occ1", "txn1", "Keycard");
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(getMock).not.toHaveBeenCalled();
    });

    it("sets error and skips Firebase for updateLoanDepositType when offline", async () => {
      const { result } = renderHook(() => useLoansMutations());

      await act(async () => {
        await result.current.updateLoanDepositType("BR1", "occ1", "txn1", "CASH");
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(getMock).not.toHaveBeenCalled();
    });
  });
});
