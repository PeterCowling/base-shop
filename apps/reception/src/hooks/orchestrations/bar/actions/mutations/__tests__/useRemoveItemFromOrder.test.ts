import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useRemoveItemFromOrder } from "../useRemoveItemFromOrder";

// Mock placeholders live above the `vi.mock` call because Vitest
// hoists the call before other statements.

/* eslint-disable no-var */
var database: unknown;
var refMock: jest.Mock;
var getMock: jest.Mock;
var setMock: jest.Mock;
var removeMock: jest.Mock;
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

function snap(val: unknown) {
  return { exists: () => val !== null && val !== undefined, val: () => val };
}

beforeEach(() => {
  database = {};
  refMock.mockClear();
  getMock.mockReset();
  setMock.mockReset();
  removeMock.mockReset();
});

describe("useRemoveItemFromOrder", () => {
  it("decrements count when multiple items exist", async () => {
    getMock.mockResolvedValueOnce(
      snap({ confirmed: false, items: [{ product: "Beer", price: 3, count: 2 }] })
    );

    const { result } = renderHook(() => useRemoveItemFromOrder());
    await act(async () => {
      await result.current.removeItemFromOrder("Beer");
    });

    expect(setMock).toHaveBeenCalledWith({ path: "barOrders/unconfirmed" }, {
      confirmed: false,
      items: [{ product: "Beer", price: 3, count: 1 }],
    });
  });

  it("removes order when last item deleted", async () => {
    getMock.mockResolvedValueOnce(
      snap({ confirmed: false, items: [{ product: "Wine", price: 4, count: 1 }] })
    );

    const { result } = renderHook(() => useRemoveItemFromOrder());
    await act(async () => {
      await result.current.removeItemFromOrder("Wine");
    });

    expect(removeMock).toHaveBeenCalledWith({ path: "barOrders/unconfirmed" });
  });
});
