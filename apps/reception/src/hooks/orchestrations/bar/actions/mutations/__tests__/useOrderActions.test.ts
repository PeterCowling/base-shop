// src/hooks/orchestrations/bar/actions/mutations/__tests__/useOrderActions.test.ts
/* ------------------------------------------------------------------ */
/*  Test for useOrderActions                                           */
/* ------------------------------------------------------------------ */

import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";

import type { SalesOrder } from "../../../../../../types/bar/BarTypes";

/* ------------------------------------------------------------------ */
/*  Mock holders — use `var` to avoid TDZ issues with hoisted mocks   */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var refMock: jest.Mock;
var getMock: jest.Mock;
var updateMock: jest.Mock;
var removeMock: jest.Mock;
/* eslint-enable no-var */

/* ------------------------------------------------------------------ */
/*  firebase/database mock                                             */
/* ------------------------------------------------------------------ */
jest.mock("firebase/database", () => {
  refMock = jest.fn((_db: unknown, path: string) => ({ path }));
  getMock = jest.fn();
  updateMock = jest.fn();
  removeMock = jest.fn();

  return {
    ref: refMock,
    get: getMock,
    update: updateMock,
    remove: removeMock,
  };
});

/* Minimal stub for useFirebaseDatabase – the hook only needs an object */
jest.mock("../../../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

// Import the hook under test AFTER registering mocks
import { useOrderActions } from "../useOrderActions";

/* ------------------------------------------------------------------ */
/*  Helper to create a DataSnapshot‑like object                        */
/* ------------------------------------------------------------------ */
function snap(val: unknown) {
  return {
    exists: () => val !== null && val !== undefined,
    val: () => val,
  };
}

/* ------------------------------------------------------------------ */
/*  Test suite                                                         */
/* ------------------------------------------------------------------ */
describe("useOrderActions", () => {
  beforeEach(() => {
    // Reset mocks between tests to avoid cross‑test interference
    refMock.mockClear();
    getMock.mockReset();
    updateMock.mockReset();
    removeMock.mockReset();
  });

  it("removing ALL items moves order to completed and deletes sales entry", async () => {
    const existingCompleted = { items: [{ product: "old", count: 1 }] };
    getMock.mockResolvedValueOnce(snap(existingCompleted));

    const order: SalesOrder = {
      orderKey: "o1",
      confirmed: true,
      bleepNumber: "1",
      userName: "u",
      time: "10:00",
      paymentMethod: "cash",
      items: [{ product: "a", count: 1, lineType: "bds" }],
    };

    const { result } = renderHook(() => useOrderActions());
    let deleted = false;
    await act(async () => {
      deleted = await result.current.removeItems(order, "ALL");
    });

    expect(deleted).toBe(true); // order fully removed from "sales"
    expect(updateMock).toHaveBeenCalledWith(expect.anything(), {
      ...existingCompleted,
      ...order,
      items: [...existingCompleted.items, ...order.items],
    });
    expect(removeMock).toHaveBeenCalled(); // sales node deleted
  });

  it("removing filter 'BDS' splits items correctly", async () => {
    getMock.mockResolvedValueOnce(snap(null)); // no existing completed

    const order: SalesOrder = {
      orderKey: "o2",
      confirmed: true,
      bleepNumber: "1",
      userName: "u",
      time: "10:00",
      paymentMethod: "cash",
      items: [
        { product: "a", count: 1, lineType: "bds" },
        { product: "b", count: 1, lineType: "kds" },
      ],
    };

    const { result } = renderHook(() => useOrderActions());
    let deleted = true;
    await act(async () => {
      deleted = await result.current.removeItems(order, "BDS");
    });

    expect(deleted).toBe(false); // order remains in "sales"
    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(updateMock.mock.calls[0][1].items).toEqual([
      { product: "a", count: 1, lineType: "bds" },
    ]); // completed node
    expect(updateMock.mock.calls[1][1].items).toEqual([
      { product: "b", count: 1, lineType: "kds" },
    ]); // sales node
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("removeSingleItem deletes order when last item removed", async () => {
    getMock.mockResolvedValueOnce(snap(null));

    const order: SalesOrder = {
      orderKey: "o3",
      confirmed: true,
      bleepNumber: "1",
      userName: "u",
      time: "10:00",
      paymentMethod: "cash",
      items: [{ product: "a", count: 1 }],
    };

    const { result } = renderHook(() => useOrderActions());
    let deleted = false;
    await act(async () => {
      deleted = await result.current.removeSingleItem(order, 0);
    });

    expect(deleted).toBe(true);
    expect(updateMock).toHaveBeenCalledTimes(1); // completed node
    expect(removeMock).toHaveBeenCalled(); // sales node removed
  });

  it("removeSingleItem updates order when items remain", async () => {
    getMock.mockResolvedValueOnce(snap(null));

    const order: SalesOrder = {
      orderKey: "o4",
      confirmed: true,
      bleepNumber: "1",
      userName: "u",
      time: "10:00",
      paymentMethod: "cash",
      items: [
        { product: "a", count: 1 },
        { product: "b", count: 2 },
      ],
    };

    const { result } = renderHook(() => useOrderActions());
    let deleted = true;
    await act(async () => {
      deleted = await result.current.removeSingleItem(order, 0);
    });

    expect(deleted).toBe(false);
    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(updateMock.mock.calls[0][1].items[0].product).toBe("a"); // completed node
    expect(updateMock.mock.calls[1][1].items).toEqual([
      { product: "b", count: 2 },
    ]); // sales node
    expect(removeMock).not.toHaveBeenCalled();
  });
});
