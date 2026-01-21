import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";

import { useUpdateItemInOrder } from "../useUpdateItemInOrder";

// Declare variables for mocks before `vi.mock` so hoisted calls do
// not trigger TDZ errors.

/* eslint-disable no-var */
var database: unknown;
var refMock: jest.Mock;
var getMock: jest.Mock;
var setMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("firebase/database", () => {
  refMock = jest.fn((_db: unknown, path: string) => ({ path }));
  getMock = jest.fn();
  setMock = jest.fn();

  return {
    ref: refMock,
    get: getMock,
    set: setMock,
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
});

describe("useUpdateItemInOrder", () => {
  it("updates product name and price", async () => {
    getMock.mockResolvedValueOnce(
      snap({ confirmed: false, items: [{ product: "Beer", price: 3, count: 1 }] })
    );

    const { result } = renderHook(() =>
      useUpdateItemInOrder({ unconfirmedOrder: null })
    );

    await act(async () => {
      await result.current.updateItemInOrder("Beer", "Wine", 4);
    });

    expect(setMock).toHaveBeenCalledWith({ path: "barOrders/unconfirmed" }, {
      confirmed: false,
      items: [{ product: "Wine", price: 4, count: 1 }],
    });
    expect(result.current.error).toBeNull();
  });
});
