import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useConfirmOrder } from "../useConfirmOrder";

// Placeholders for mocks must be defined ahead of the `vi.mock`
// call. The mock factory assigns values when executed.

/* eslint-disable no-var */
var database: unknown;
var refMock: ReturnType<typeof vi.fn>;
var getMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
var removeMock: ReturnType<typeof vi.fn>;
var addTxnMock: ReturnType<typeof vi.fn>;
var decIngMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("firebase/database", () => {
  refMock = vi.fn((_db: unknown, path: string) => ({ path }));
  getMock = vi.fn();
  setMock = vi.fn();
  removeMock = vi.fn();

  return {
    ref: refMock,
    get: getMock,
    set: setMock,
    remove: removeMock,
  };
});

vi.mock("../../../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

vi.mock("../../../../../../hooks/data/inventory/useIngredients", () => ({
  default: () => ({ decrementIngredient: decIngMock }),
}));

vi.mock("../../../../../../hooks/mutations/useAllTransactionsMutations", () => ({
  default: () => ({ addToAllTransactions: addTxnMock }),
}));

vi.mock("../../../../../../utils/generateTransactionId", () => ({
  generateTransactionId: () => "txn1",
}));

function snap(val: unknown) {
  return { exists: () => val !== null && val !== undefined, val: () => val };
}

beforeEach(() => {
  database = {};
  addTxnMock = vi.fn();
  decIngMock = vi.fn();
  refMock.mockClear();
  getMock.mockReset();
  setMock.mockReset();
  removeMock.mockReset();
});

describe("useConfirmOrder", () => {
  it("moves unconfirmed order to sales and logs items", async () => {
    getMock.mockResolvedValueOnce(
      snap({
        confirmed: false,
        items: [{ product: "Beer", price: 3, count: 1, lineType: "bds" }],
      })
    );

    const { result } = renderHook(() =>
      useConfirmOrder({ getCategoryTypeByProductName: () => "cat" })
    );

    await act(async () => {
      await result.current.confirmOrder("1", "user", "10:00", "cash");
    });

    expect(setMock).toHaveBeenCalledWith(
      { path: "barOrders/sales/txn1" },
      expect.objectContaining({ orderKey: "txn1" })
    );
    expect(removeMock).toHaveBeenCalledWith({ path: "barOrders/unconfirmed" });
    expect(decIngMock).toHaveBeenCalledWith("Beer", 1);
    expect(addTxnMock).toHaveBeenCalledWith(
      "txn1-0",
      expect.objectContaining({ bookingRef: "1", description: "Beer" })
    );
    expect(result.current.error).toBeNull();
  });
});
