import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useClearOrder } from "../useClearOrder";

// Declare mocks before the `vi.mock` factory. Vitest hoists the
// call so these variables must exist when the mock executes.

/* eslint-disable no-var */
var database: unknown;
var refMock: jest.Mock;
var getMock: jest.Mock;
var removeMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("firebase/database", () => {
  refMock = jest.fn((_db: unknown, path: string) => ({ path }));
  getMock = jest.fn();
  removeMock = jest.fn();

  return {
    ref: refMock,
    get: getMock,
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
  removeMock.mockReset();
});

describe("useClearOrder", () => {
  it("removes order when node exists", async () => {
    getMock.mockResolvedValueOnce(snap({ items: [] }));
    const { result } = renderHook(() => useClearOrder());

    await act(async () => {
      await result.current.clearOrder();
    });

    expect(removeMock).toHaveBeenCalledWith({ path: "barOrders/unconfirmed" });
    expect(result.current.error).toBeNull();
  });
});
