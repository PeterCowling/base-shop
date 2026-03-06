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

jest.mock("../useActivitiesMutations", () => ({
  __esModule: true,
  default: () => ({
    logActivity: jest.fn().mockResolvedValue(undefined),
    addActivity: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

jest.mock("../useAllTransactionsMutations", () => ({
  __esModule: true,
  default: () => ({
    addToAllTransactions: jest.fn().mockResolvedValue(undefined),
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

    it("waits for all matching removals before cleanup check", async () => {
      const removeResolvers: Array<() => void> = [];
      removeMock.mockImplementation(() => {
        if (removeResolvers.length < 2) {
          return new Promise<void>((resolve) => {
            removeResolvers.push(resolve);
          });
        }
        return Promise.resolve();
      });

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
        .mockResolvedValueOnce({
          exists: () => false,
          size: 0,
        });

      const { result } = renderHook(() => useLoansMutations());

      let pending!: Promise<void | null>;
      await act(async () => {
        pending = result.current.removeLoanTransactionsForItem(
          "BR1",
          "occ1",
          "Keycard"
        );
      });

      expect(removeMock).toHaveBeenCalledTimes(2);
      expect(getMock).toHaveBeenCalledTimes(1);

      removeResolvers[0]?.();
      await Promise.resolve();
      expect(getMock).toHaveBeenCalledTimes(1);

      removeResolvers[1]?.();
      await act(async () => {
        await pending;
      });

      expect(getMock).toHaveBeenCalledTimes(2);
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
