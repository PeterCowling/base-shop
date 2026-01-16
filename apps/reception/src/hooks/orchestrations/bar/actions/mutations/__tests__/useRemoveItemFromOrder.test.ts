import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRemoveItemFromOrder } from "../useRemoveItemFromOrder";

// Mock placeholders live above the `vi.mock` call because Vitest
// hoists the call before other statements.

/* eslint-disable no-var */
var database: unknown;
var refMock: ReturnType<typeof vi.fn>;
var getMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
var removeMock: ReturnType<typeof vi.fn>;
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
