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
var addLedgerEntryMock: jest.Mock;
var inventoryItemsMock: jest.Mock;
var inventoryRecipesMock: jest.Mock;
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

jest.mock("../../../../../../hooks/data/inventory/useInventoryItems", () => {
  inventoryItemsMock = jest.fn();
  return { __esModule: true, default: () => inventoryItemsMock() };
});

jest.mock("../../../../../../hooks/data/inventory/useInventoryRecipes", () => {
  inventoryRecipesMock = jest.fn();
  return { __esModule: true, default: () => inventoryRecipesMock() };
});

jest.mock("../../../../../../hooks/mutations/useInventoryLedgerMutations", () => ({
  useInventoryLedgerMutations: () => ({ addLedgerEntry: addLedgerEntryMock }),
}));

jest.mock("../../../../../../hooks/mutations/useAllTransactionsMutations", () => ({
  __esModule: true,
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
  addLedgerEntryMock = jest.fn();
  inventoryItemsMock = jest.fn();
  inventoryRecipesMock = jest.fn();
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

    inventoryItemsMock.mockReturnValue({
      items: [
        { id: "menu-1", name: "Beer", unit: "unit", openingCount: 0, category: "menu" },
        { id: "ing-1", name: "Hops", unit: "g", openingCount: 0, category: "ingredient" },
      ],
      itemsById: {
        "menu-1": { id: "menu-1", name: "Beer", unit: "unit", openingCount: 0, category: "menu" },
        "ing-1": { id: "ing-1", name: "Hops", unit: "g", openingCount: 0, category: "ingredient" },
      },
      loading: false,
      error: null,
    });
    inventoryRecipesMock.mockReturnValue({
      recipes: { "menu-1": { items: { "ing-1": 2 } } },
      loading: false,
      error: null,
    });

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
    expect(addLedgerEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "ing-1",
        type: "sale",
        quantity: -2,
      })
    );
    expect(addTxnMock).toHaveBeenCalledWith(
      "txn1-0",
      expect.objectContaining({ bookingRef: "1", description: "Beer" })
    );
    expect(result.current.error).toBeNull();
  });
});
