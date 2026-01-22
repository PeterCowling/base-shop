import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useConfirmOrder } from "../useConfirmOrder";

// Placeholders for mocks must be defined ahead of the `vi.mock`
// call. The mock factory assigns values when executed.

/* eslint-disable no-var */
var database: unknown;
var refMock: jest.Mock;
var getMock: jest.Mock;
var setMock: jest.Mock;
var removeMock: jest.Mock;
var addTxnMock: jest.Mock;
var decIngMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("firebase/database", () => {
  refMock = jest.fn((_db: unknown, path: string) => ({ path }));
  getMock = jest.fn();
  setMock = jest.fn();
  removeMock = jest.fn();

  return {
    ref: refMock,
    get: getMock,
    set: setMock,
    remove: removeMock,
  };
});

jest.mock("../../../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("../../../../../../hooks/data/inventory/useIngredients", () => ({
  default: () => ({ decrementIngredient: decIngMock }),
}));

jest.mock("../../../../../../hooks/mutations/useAllTransactionsMutations", () => ({
  default: () => ({ addToAllTransactions: addTxnMock }),
}));

jest.mock("../../../../../../utils/generateTransactionId", () => ({
  generateTransactionId: () => "txn1",
}));

function snap(val: unknown) {
  return { exists: () => val !== null && val !== undefined, val: () => val };
}

beforeEach(() => {
  database = {};
  addTxnMock = jest.fn();
  decIngMock = jest.fn();
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
