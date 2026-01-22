import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useAddItemToOrder } from "../useAddItemToOrder";

// Mocks need to be declared above the `vi.mock` call.
// Jest hoists `jest.mock` to the top of the file, so using `var`
// ensures these variables exist when the factory runs.

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

describe("useAddItemToOrder", () => {
  it("increments count when item already exists", async () => {
    getMock.mockResolvedValueOnce(
      snap({ confirmed: false, items: [{ product: "Beer", price: 3, count: 1, lineType: "bds" }] })
    );

    const { result } = renderHook(() =>
      useAddItemToOrder({ mapToLineType: () => "bds" })
    );

    await act(async () => {
      await result.current.addItemToOrder("Beer", 3, null);
    });

    expect(setMock).toHaveBeenCalledWith({ path: "barOrders/unconfirmed" }, {
      confirmed: false,
      items: [{ product: "Beer", price: 3, count: 2, lineType: "bds" }],
    });
    expect(result.current.error).toBeNull();
  });
});
